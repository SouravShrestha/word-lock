import { getSupabaseAdmin } from "@/integrations/supabase/client.server";
import { PublicError } from "@/lib/http/errors";
import { resolvePlayer, type Caller } from "./identity.server";
import { touchPlayStreak } from "./streak.server";
import { computeStarOutcome } from "./stars.server";
import { isWord } from "./dictionary.server";
import { loadGame, toEngineMoves, turnDeadlineOf, type GameRow, type MoveRow } from "./read.server";
import {
  chargeClock,
  computeBoardState,
  isBankControl,
  isTurnExpired,
  turnDeadlineFor,
  validateMove,
  MOVE_REJECTION_MESSAGES,
  type PlayerSlot,
} from "@word-lock/core/game";

export async function claimTurn(game: GameRow, expectedPlayerId: string): Promise<string> {
  const claimedAt = new Date().toISOString();
  const { data, error } = await getSupabaseAdmin()
    .from("wl_games")
    .update({ last_move_at: claimedAt })
    .eq("id", game.id)
    .eq("current_turn_player_id", expectedPlayerId)
    .eq("last_move_at", game.last_move_at)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) {
    throw new PublicError("Someone else already took this turn. Refresh and try again.");
  }
  return claimedAt;
}

/**
 * The mover's bank after the turn that just ended, as the column to write.
 * `turnStartedAt` is taken by the caller before `claimTurn`, which moves
 * `last_move_at` on as its lock and so no longer says when the turn began.
 */
function chargedClock(game: GameRow, moverId: string, turnStartedAt: string, nowMs: number) {
  const slot = moverId === game.player1_id ? 1 : 2;
  const bank = slot === 1 ? game.p1_clock_ms : game.p2_clock_ms;
  const charged = isBankControl(game.time_control) ? chargeClock(bank, turnStartedAt, nowMs) : bank;
  return { slot, charged, patch: slot === 1 ? { p1_clock_ms: charged } : { p2_clock_ms: charged } };
}

export async function finishOrAdvance(game: GameRow, moves: MoveRow[], turnStartedAt: string) {
  const state = computeBoardState(game.grid.split(""), toEngineMoves(game, moves));
  const nowMs = Date.now();
  const now = new Date(nowMs).toISOString();
  const last = moves[moves.length - 1];
  const mover = chargedClock(game, last.player_id, turnStartedAt, nowMs);

  if (state.finished) {
    const winnerId =
      state.winnerSlot === 1 ? game.player1_id : state.winnerSlot === 2 ? game.player2_id : null;

    const { outcome, commit } = await computeStarOutcome(game, winnerId);

    const { data: completed } = await getSupabaseAdmin()
      .from("wl_games")
      .update({
        status: "completed",
        winner_id: winnerId,
        end_reason: state.endReason,
        last_move_at: now,
        turn_deadline: null,
        ...mover.patch,
        p1_star_delta: outcome.p1Delta,
        p2_star_delta: outcome.p2Delta,
        p1_stars_after: outcome.p1StarsAfter,
        p2_stars_after: outcome.p2StarsAfter,
      })
      .eq("id", game.id)
      .neq("status", "completed")
      .select("id")
      .maybeSingle();

    if (completed) await commit();
    return;
  }

  const next =
    last.player_id === game.player1_id ? (game.player2_id ?? game.player1_id) : game.player1_id;
  const nextBank =
    next === last.player_id
      ? mover.charged
      : next === game.player1_id
        ? game.p1_clock_ms
        : game.p2_clock_ms;
  await getSupabaseAdmin()
    .from("wl_games")
    .update({
      current_turn_player_id: next,
      last_move_at: now,
      turn_deadline: turnDeadlineFor(game.time_control, nextBank, nowMs),
      ...mover.patch,
    })
    .eq("id", game.id);
}

/**
 * A timed game whose player on turn ran out: the opponent wins, ranked exactly
 * like a forfeit. `claimTurn` first, so a move racing the flag either lands
 * before this (and the claim fails) or is rejected after it.
 */
async function loseOnTime(game: GameRow, loserId: string): Promise<boolean> {
  try {
    await claimTurn(game, loserId);
  } catch {
    return false;
  }

  const winnerId = loserId === game.player1_id ? game.player2_id : game.player1_id;
  const { outcome, commit } = await computeStarOutcome(game, winnerId);

  const { data: completed } = await getSupabaseAdmin()
    .from("wl_games")
    .update({
      status: "completed",
      winner_id: winnerId,
      end_reason: "timeout",
      last_move_at: new Date().toISOString(),
      turn_deadline: null,
      ...(loserId === game.player1_id ? { p1_clock_ms: 0 } : { p2_clock_ms: 0 }),
      p1_star_delta: outcome.p1Delta,
      p2_star_delta: outcome.p2Delta,
      p1_stars_after: outcome.p1StarsAfter,
      p2_stars_after: outcome.p2StarsAfter,
    })
    .eq("id", game.id)
    .neq("status", "completed")
    .select("id")
    .maybeSingle();

  if (completed) await commit();
  return Boolean(completed);
}

/**
 * The one path for a turn whose deadline has passed, shared by the client-fired
 * timeout and the cron sweep. A timed game is lost on time; a daily game passes
 * the move for the player, as every game did before time controls existed.
 */
export async function expireTurn(game: GameRow, moves: MoveRow[]): Promise<boolean> {
  const playerId = game.current_turn_player_id;
  if (!playerId) return false;

  if (isBankControl(game.time_control)) return loseOnTime(game, playerId);

  const turnStartedAt = game.last_move_at;
  try {
    await claimTurn(game, playerId);
  } catch {
    return false;
  }

  const { data: inserted, error } = await getSupabaseAdmin()
    .from("wl_moves")
    .insert({ game_id: game.id, player_id: playerId, word: "", tile_indices: [], passed: true })
    .select("*")
    .single();
  if (error || !inserted) return false;

  await finishOrAdvance(game, [...moves, inserted as MoveRow], turnStartedAt);
  return true;
}

/**
 * A move from a player whose bank already ran out ends the game instead of
 * landing. Daily games have no such rule: a late move there is still a move
 * until someone sweeps the turn.
 */
async function rejectIfOutOfTime(game: GameRow, playerId: string) {
  if (game.status !== "active" || game.current_turn_player_id !== playerId) return;
  if (!isBankControl(game.time_control)) return;
  if (!isTurnExpired(turnDeadlineOf(game), Date.now())) return;

  await loseOnTime(game, playerId);
  throw new PublicError("Your time ran out.");
}

export async function submitMove(
  caller: Caller,
  roomCode: string,
  word: string,
  tileIndices: number[],
) {
  const player = await resolvePlayer(caller);
  const loaded = await loadGame(roomCode);
  if (!loaded) throw new PublicError("No game found with that code. ");
  const { game, moves } = loaded;

  await rejectIfOutOfTime(game, player.id);

  const state = computeBoardState(game.grid.split(""), toEngineMoves(game, moves));
  const rejection = validateMove({
    grid: game.grid.split(""),
    word,
    tileIndices,
    state,
    isPlayersTurn: game.current_turn_player_id === player.id,
    gameActive: game.status === "active",
    isWord,
  });
  if (rejection) throw new PublicError(MOVE_REJECTION_MESSAGES[rejection]);

  const turnStartedAt = game.last_move_at;
  await claimTurn(game, player.id);

  const { data: inserted, error } = await getSupabaseAdmin()
    .from("wl_moves")
    .insert({
      game_id: game.id,
      player_id: player.id,
      word: word.trim().toUpperCase(),
      tile_indices: tileIndices,
      passed: false,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await finishOrAdvance(game, [...moves, inserted as MoveRow], turnStartedAt);
  await touchPlayStreak(player, caller.timezone);
  return { ok: true };
}

export async function passTurn(caller: Caller, roomCode: string) {
  const player = await resolvePlayer(caller);
  const loaded = await loadGame(roomCode);
  if (!loaded) throw new PublicError("No game found with that code. ");
  const { game, moves } = loaded;

  if (game.status !== "active") throw new PublicError("This game isn't active.");
  if (game.current_turn_player_id !== player.id) throw new PublicError("It's not your turn yet.");

  await rejectIfOutOfTime(game, player.id);
  const turnStartedAt = game.last_move_at;
  await claimTurn(game, player.id);

  const { data: inserted, error } = await getSupabaseAdmin()
    .from("wl_moves")
    .insert({ game_id: game.id, player_id: player.id, word: "", tile_indices: [], passed: true })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await finishOrAdvance(game, [...moves, inserted as MoveRow], turnStartedAt);
  await touchPlayStreak(player, caller.timezone);
  return { ok: true };
}

export async function sendReaction(caller: Caller, roomCode: string, emoji: string) {
  const player = await resolvePlayer(caller);
  const loaded = await loadGame(roomCode);
  if (!loaded) throw new PublicError("No game found with that code.");
  const { game } = loaded;

  if (game.status !== "active") throw new PublicError("This game isn't active.");

  const slot: PlayerSlot | null =
    game.player1_id === player.id ? 1 : game.player2_id === player.id ? 2 : null;
  if (!slot) throw new PublicError("You're not a player in this game.");

  // Private: only the two players can receive (migration 014). The service role
  // bypasses that policy, so the server remains the only sender.
  const channel = getSupabaseAdmin().channel(`reactions-${game.id}`, {
    config: { private: true },
  });
  try {
    const result = await channel.httpSend("reaction", { emoji, slot });
    if (!result.success) {
      console.error("[sendReaction] broadcast failed:", result.error);
      throw new PublicError("Failed to send reaction.");
    }
  } finally {
    await getSupabaseAdmin().removeChannel(channel);
  }

  return { ok: true };
}

export async function timeoutGame(caller: Caller, roomCode: string) {
  const player = await resolvePlayer(caller);
  const loaded = await loadGame(roomCode);
  if (!loaded) throw new PublicError("No game found with that code. ");
  const { game, moves } = loaded;

  if (game.status !== "active") throw new PublicError("This game isn't active.");
  if (game.player1_id !== player.id && game.player2_id !== player.id) {
    throw new PublicError("You are not a participant in this game.");
  }
  if (!game.current_turn_player_id) throw new PublicError("No active turn.");
  if (!isTurnExpired(turnDeadlineOf(game), Date.now())) {
    throw new PublicError("Turn has not expired yet.");
  }

  await expireTurn(game, moves);
  return { ok: true };
}
