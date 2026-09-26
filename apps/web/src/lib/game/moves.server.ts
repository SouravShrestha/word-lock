import { getSupabaseAdmin } from "@/integrations/supabase/client.server";
import { PublicError } from "@/lib/http/errors";
import { resolvePlayer, type Caller } from "./identity.server";
import { touchPlayStreak } from "./streak.server";
import { computeStarOutcome } from "./stars.server";
import { isWord } from "./dictionary.server";
import { loadGame, toEngineMoves, TURN_LIMIT_MS, type GameRow, type MoveRow } from "./read.server";
import {
  computeBoardState,
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

export async function finishOrAdvance(game: GameRow, moves: MoveRow[]) {
  const state = computeBoardState(game.grid.split(""), toEngineMoves(game, moves));
  const now = new Date().toISOString();

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

  const last = moves[moves.length - 1];
  const next =
    last.player_id === game.player1_id ? (game.player2_id ?? game.player1_id) : game.player1_id;
  await getSupabaseAdmin()
    .from("wl_games")
    .update({ current_turn_player_id: next, last_move_at: now })
    .eq("id", game.id);
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

  await finishOrAdvance(game, [...moves, inserted as MoveRow]);
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

  await claimTurn(game, player.id);

  const { data: inserted, error } = await getSupabaseAdmin()
    .from("wl_moves")
    .insert({ game_id: game.id, player_id: player.id, word: "", tile_indices: [], passed: true })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await finishOrAdvance(game, [...moves, inserted as MoveRow]);
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

  const channel = getSupabaseAdmin().channel(`game-${game.id}`);
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

  const msLeft =
    new Date(new Date(game.last_move_at).getTime() + TURN_LIMIT_MS).getTime() - Date.now();
  if (msLeft > 0) throw new PublicError("Turn has not expired yet.");

  try {
    await claimTurn(game, game.current_turn_player_id);
  } catch {
    return { ok: true };
  }

  const { data: inserted, error } = await getSupabaseAdmin()
    .from("wl_moves")
    .insert({
      game_id: game.id,
      player_id: game.current_turn_player_id,
      word: "",
      tile_indices: [],
      passed: true,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  await finishOrAdvance(game, [...moves, inserted as MoveRow]);
  return { ok: true };
}
