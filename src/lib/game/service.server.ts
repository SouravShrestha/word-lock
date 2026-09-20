// Server-only Word-lock game service. Holds all trusted game logic.
//
// Identity is never taken from a raw session id here. Every entry point receives
// a `Caller` built by `resolveCaller` in the route handler, and resolves it via
// `resolvePlayer`, so a logged-in player is identified by their verified account
// rather than by whatever the request body claimed.
import { getSupabaseAdmin } from "@/integrations/supabase/client.server";
import { UNNAMED_PLAYER } from "@/lib/account/names";
import { resolvePlayer, type Caller } from "./identity.server";
import { touchPlayStreak } from "./streak.server";
import { computeStarOutcome } from "./stars.server";
import { getDictionary, isWord } from "./dictionary.server";
import {
  computeBoardState,
  generateGrid,
  validateMove,
  MOVE_REJECTION_MESSAGES,
  type EngineMove,
  type PlayerSlot,
} from "./engine";
import { computeStats, MAX_RECENT_GAMES, type StatsGameInput } from "./stats";
import type { GamePlayerRow, GameRow, MoveRow, PlayerRow } from "./rows";

export const MAX_ACTIVE_GAMES = 5;
export const TURN_LIMIT_MS = 24 * 60 * 60 * 1000;

const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeRoomCode(length = 5) {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ROOM_ALPHABET[Math.floor(Math.random() * ROOM_ALPHABET.length)];
  }
  return out;
}

// Re-exported so existing importers keep working; the definitions live in
// `rows.ts` to avoid a cycle with `identity.server.ts`.
export type { PlayerRow, PlayerAccountRow, GamePlayerRow, GameRow, MoveRow } from "./rows";

function toEngineMoves(game: GameRow, moves: MoveRow[]): EngineMove[] {
  return moves.map((m) => ({
    playerSlot: (m.player_id === game.player1_id ? 1 : 2) as PlayerSlot,
    word: m.word,
    tileIndices: m.tile_indices ?? [],
    passed: m.passed,
  }));
}

export async function loadGame(roomCode: string) {
  const { data: game } = await getSupabaseAdmin()
    .from("wl_games")
    .select("*")
    .eq("room_code", roomCode.toUpperCase())
    .maybeSingle();
  if (!game) return null;

  const [{ data: moves }, { data: players }] = await Promise.all([
    getSupabaseAdmin()
      .from("wl_moves")
      .select("*")
      .eq("game_id", game.id)
      .order("created_at", { ascending: true }),
    getSupabaseAdmin()
      .from("wl_players")
      // user_id comes along so the fetch route can identify a logged-in viewer
      // without trusting the session id in the request body.
      .select("id, session_id, username, avatar, user_id")
      .in("id", [game.player1_id, game.player2_id].filter(Boolean) as string[]),
  ]);

  return {
    game: game as GameRow,
    moves: (moves ?? []) as MoveRow[],
    players: (players ?? []) as GamePlayerRow[],
  };
}

export function serializeGame(
  game: GameRow,
  moves: MoveRow[],
  players: PlayerRow[],
  viewerId: string | null,
) {
  const state = computeBoardState(game.grid.split(""), toEngineMoves(game, moves));
  const p1 = players.find((p) => p.id === game.player1_id) ?? null;
  const p2 = players.find((p) => p.id === game.player2_id) ?? null;

  return {
    id: game.id,
    roomCode: game.room_code,
    grid: game.grid.split(""),
    status: game.status,
    endReason: game.end_reason,
    winnerId: game.winner_id,
    lastMoveAt: game.last_move_at,
    currentTurnPlayerId: game.current_turn_player_id,
    turnDeadline: new Date(new Date(game.last_move_at).getTime() + TURN_LIMIT_MS).toISOString(),
    /*
     * `name` is the account's username. It is nullable because a row can exist
     * before a handle is claimed, and the UI falls back rather than rendering
     * "null" — but in practice every player in a real game has one, since login
     * and the username sheet both come first.
     */
    players: {
      one: p1 ? { id: p1.id, name: p1.username ?? UNNAMED_PLAYER, avatar: p1.avatar } : null,
      two: p2 ? { id: p2.id, name: p2.username ?? UNNAMED_PLAYER, avatar: p2.avatar } : null,
    },
    viewerSlot: viewerId
      ? viewerId === game.player1_id
        ? 1
        : viewerId === game.player2_id
          ? 2
          : null
      : null,
    /*
     * Star movement from this game, per slot. Null until the game completes, and
     * null forever on an unranked game (one where either side was a guest) —
     * which is exactly how the end-of-game screen decides whether to show a
     * delta at all.
     */
    starDeltas: {
      1: game.p1_star_delta,
      2: game.p2_star_delta,
    },
    owners: state.owners,
    locked: state.locked,
    scores: state.scores,
    neutral: state.neutral,
    playedWords: moves
      .filter((m) => !m.passed)
      .map((m) => ({ word: m.word, playerId: m.player_id })),
    history: moves.map((m) => ({
      id: m.id,
      word: m.word,
      passed: m.passed,
      playerId: m.player_id,
      createdAt: m.created_at,
    })),
  };
}

export type SerializedGame = ReturnType<typeof serializeGame>;

export { findViewerId } from "./viewer";

async function countActiveGames(playerId: string) {
  const { count } = await getSupabaseAdmin()
    .from("wl_games")
    .select("id", { count: "exact", head: true })
    .neq("status", "completed")
    .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`);
  return count ?? 0;
}

export async function createGame(caller: Caller) {
  const player = await resolvePlayer(caller);
  if ((await countActiveGames(player.id)) >= MAX_ACTIVE_GAMES) {
    throw new Error(
      `You already have ${MAX_ACTIVE_GAMES} games on the go. Finish one before starting another.`,
    );
  }

  const grid = generateGrid(getDictionary()).join("");

  for (let attempt = 0; attempt < 6; attempt++) {
    const roomCode = makeRoomCode();
    const { data, error } = await getSupabaseAdmin()
      .from("wl_games")
      .insert({
        room_code: roomCode,
        grid,
        player1_id: player.id,
        current_turn_player_id: player.id,
        status: "waiting",
      })
      .select("room_code")
      .maybeSingle();
    if (data) return { roomCode: data.room_code };
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
  }
  throw new Error("Couldn't allocate a room code. Try again.");
}

export async function joinGame(caller: Caller, roomCode: string) {
  const player = await resolvePlayer(caller);
  const loaded = await loadGame(roomCode);
  if (!loaded) throw new Error("No game found with that code.");
  const { game } = loaded;

  if (game.player1_id === player.id || game.player2_id === player.id) {
    return { roomCode: game.room_code };
  }
  if (game.player2_id) throw new Error("That game is already full.");
  if (game.status === "completed") throw new Error("That game is already finished.");
  if ((await countActiveGames(player.id)) >= MAX_ACTIVE_GAMES) {
    throw new Error(
      `You already have ${MAX_ACTIVE_GAMES} games on the go. Finish one before joining another.`,
    );
  }

  const { error } = await getSupabaseAdmin()
    .from("wl_games")
    .update({ player2_id: player.id })
    .eq("id", game.id)
    .is("player2_id", null);
  if (error) throw new Error(error.message);

  return { roomCode: game.room_code };
}

export async function startGame(caller: Caller, roomCode: string) {
  const player = await resolvePlayer(caller);
  const { data: game } = await getSupabaseAdmin()
    .from("wl_games")
    .select("id, status, player1_id, player2_id")
    .eq("room_code", roomCode.toUpperCase())
    .maybeSingle();

  if (!game) throw new Error("Game not found.");
  if (game.player1_id !== player.id) throw new Error("Only the host can start the game.");
  if (game.status !== "waiting") throw new Error("Game is not in the waiting state.");
  if (!game.player2_id) throw new Error("Waiting for an opponent to join.");

  const { error } = await getSupabaseAdmin()
    .from("wl_games")
    .update({
      status: "active",
      current_turn_player_id: game.player1_id,
      last_move_at: new Date().toISOString(),
    })
    .eq("id", game.id);
  if (error) throw new Error(error.message);

  return { ok: true };
}

export async function destroyGame(caller: Caller, roomCode: string) {
  const player = await resolvePlayer(caller);
  const { data: game } = await getSupabaseAdmin()
    .from("wl_games")
    .select("id, status, player1_id")
    .eq("room_code", roomCode.toUpperCase())
    .maybeSingle();

  if (!game) return { ok: true };

  if (game.status === "waiting" && game.player1_id === player.id) {
    await getSupabaseAdmin().from("wl_games").delete().eq("id", game.id);
  }
  return { ok: true };
}

export async function forfeitGame(caller: Caller, roomCode: string) {
  const player = await resolvePlayer(caller);
  const { data: game } = await getSupabaseAdmin()
    .from("wl_games")
    .select("id, status, player1_id, player2_id")
    .eq("room_code", roomCode.toUpperCase())
    .maybeSingle();

  if (!game) throw new Error("Game not found.");
  if (game.status !== "active") throw new Error("This game isn't active.");

  const isPlayer1 = game.player1_id === player.id;
  const isPlayer2 = game.player2_id === player.id;
  if (!isPlayer1 && !isPlayer2) throw new Error("You are not a participant in this game.");

  const winnerId = isPlayer1 ? game.player2_id : game.player1_id;

  // A forfeit is a real result, so it moves stars like any other completion. The
  // full row is needed for the star calculation, which the narrow select above
  // does not provide.
  const loaded = await loadGame(roomCode);
  const { outcome, commit } = loaded
    ? await computeStarOutcome(loaded.game, winnerId)
    : { outcome: { p1Delta: null, p2Delta: null }, commit: async () => {} };

  const { data: completed } = await getSupabaseAdmin()
    .from("wl_games")
    .update({
      status: "completed",
      winner_id: winnerId,
      end_reason: "forfeit",
      last_move_at: new Date().toISOString(),
      p1_star_delta: outcome.p1Delta,
      p2_star_delta: outcome.p2Delta,
    })
    .eq("id", game.id)
    .neq("status", "completed")
    .select("id")
    .maybeSingle();

  if (completed) await commit();

  return { ok: true };
}

async function finishOrAdvance(game: GameRow, moves: MoveRow[]) {
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
      })
      .eq("id", game.id)
      /*
       * Only the request that actually flips the game to completed applies the
       * stars. Two requests racing to finish the same game would otherwise each
       * award a full delta.
       */
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
  if (!loaded) throw new Error("No game found with that code. ");
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
  if (rejection) throw new Error(MOVE_REJECTION_MESSAGES[rejection]);

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
  if (!loaded) throw new Error("No game found with that code. ");
  const { game, moves } = loaded;

  if (game.status !== "active") throw new Error("This game isn't active.");
  if (game.current_turn_player_id !== player.id) throw new Error("It's not your turn yet.");

  const { data: inserted, error } = await getSupabaseAdmin()
    .from("wl_moves")
    .insert({ game_id: game.id, player_id: player.id, word: "", tile_indices: [], passed: true })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await finishOrAdvance(game, [...moves, inserted as MoveRow]);
  // A pass is still a turn taken, so it counts toward the daily streak.
  await touchPlayStreak(player, caller.timezone);
  return { ok: true };
}

export async function listGamesForSession(caller: Caller) {
  const player = await resolvePlayer(caller);
  const { data: games } = await getSupabaseAdmin()
    .from("wl_games")
    .select("*")
    .or(`player1_id.eq.${player.id},player2_id.eq.${player.id}`)
    .order("last_move_at", { ascending: false })
    .limit(30);

  const rows = (games ?? []) as GameRow[];
  const ids = rows.map((g) => g.id);
  const playerIds = new Set<string>();
  rows.forEach((g) => {
    playerIds.add(g.player1_id);
    if (g.player2_id) playerIds.add(g.player2_id);
  });

  const [{ data: moves }, { data: people }] = await Promise.all([
    ids.length
      ? getSupabaseAdmin().from("wl_moves").select("*").in("game_id", ids)
      : Promise.resolve({ data: [] as MoveRow[] }),
    getSupabaseAdmin()
      .from("wl_players")
      .select("id, session_id, username, avatar")
      .in("id", Array.from(playerIds)),
  ]);

  const byGame = new Map<string, MoveRow[]>();
  for (const move of (moves ?? []) as MoveRow[]) {
    const list = byGame.get(move.game_id) ?? [];
    list.push(move);
    byGame.set(move.game_id, list);
  }

  return {
    player: { id: player.id, name: player.username ?? UNNAMED_PLAYER },
    games: rows.map((game) => {
      const gameMoves = (byGame.get(game.id) ?? []).sort((a, b) =>
        a.created_at.localeCompare(b.created_at),
      );
      return serializeGame(game, gameMoves, (people ?? []) as PlayerRow[], player.id);
    }),
  };
}

export async function getPlayerStats(caller: Caller) {
  const player = await resolvePlayer(caller);
  const { data: games } = await getSupabaseAdmin()
    .from("wl_games")
    .select("*")
    .eq("status", "completed")
    .or(`player1_id.eq.${player.id},player2_id.eq.${player.id}`)
    .order("last_move_at", { ascending: false });

  const rows = (games ?? []) as GameRow[];
  // Only the most recent games need move history (for score computation) and
  // opponent names — overview counts are derived from winner_id alone.
  const recentRows = rows.slice(0, MAX_RECENT_GAMES);
  const recentIds = recentRows.map((g) => g.id);
  const playerIds = new Set<string>();
  recentRows.forEach((g) => {
    playerIds.add(g.player1_id);
    if (g.player2_id) playerIds.add(g.player2_id);
  });

  const [{ data: moves }, { data: people }] = await Promise.all([
    recentIds.length
      ? getSupabaseAdmin().from("wl_moves").select("*").in("game_id", recentIds)
      : Promise.resolve({ data: [] as MoveRow[] }),
    playerIds.size
      ? getSupabaseAdmin()
          .from("wl_players")
          .select("id, session_id, username, avatar")
          .in("id", Array.from(playerIds))
      : Promise.resolve({ data: [] as PlayerRow[] }),
  ]);

  const byGame = new Map<string, MoveRow[]>();
  for (const move of (moves ?? []) as MoveRow[]) {
    const list = byGame.get(move.game_id) ?? [];
    list.push(move);
    byGame.set(move.game_id, list);
  }

  const people_ = (people ?? []) as PlayerRow[];
  const recentGameIds = new Set(recentIds);
  const statsGames: StatsGameInput[] = rows.map((game) => {
    let scores = { 1: 0, 2: 0 };
    if (recentGameIds.has(game.id)) {
      const gameMoves = (byGame.get(game.id) ?? []).sort((a, b) =>
        a.created_at.localeCompare(b.created_at),
      );
      scores = computeBoardState(game.grid.split(""), toEngineMoves(game, gameMoves)).scores;
    }
    return {
      id: game.id,
      room_code: game.room_code,
      player1_id: game.player1_id,
      player2_id: game.player2_id,
      status: game.status,
      winner_id: game.winner_id,
      last_move_at: game.last_move_at,
      p1_star_delta: game.p1_star_delta,
      p2_star_delta: game.p2_star_delta,
      scores,
    };
  });

  return computeStats(player.id, statsGames, people_);
}

/** Auto-passes any active game whose current turn has run past 24 hours. */
export async function sweepExpiredTurns() {
  const cutoff = new Date(Date.now() - TURN_LIMIT_MS).toISOString();
  const { data: games } = await getSupabaseAdmin()
    .from("wl_games")
    .select("*")
    .eq("status", "active")
    .lt("last_move_at", cutoff);

  let swept = 0;
  for (const game of (games ?? []) as GameRow[]) {
    if (!game.current_turn_player_id) continue;
    const { data: moves } = await getSupabaseAdmin()
      .from("wl_moves")
      .select("*")
      .eq("game_id", game.id)
      .order("created_at", { ascending: true });
    const { data: inserted } = await getSupabaseAdmin()
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
    if (!inserted) continue;
    await finishOrAdvance(game, [...((moves ?? []) as MoveRow[]), inserted as MoveRow]);
    swept++;
  }
  return { swept };
}

/**
 * Client-triggered timeout for a specific game.
 * Verifies the player is in the game, the game is active, and the current turn has expired.
 */
export async function timeoutGame(caller: Caller, roomCode: string) {
  const player = await resolvePlayer(caller);
  const loaded = await loadGame(roomCode);
  if (!loaded) throw new Error("No game found with that code. ");
  const { game, moves } = loaded;

  if (game.status !== "active") throw new Error("This game isn't active.");
  if (game.player1_id !== player.id && game.player2_id !== player.id) {
    throw new Error("You are not a participant in this game.");
  }
  if (!game.current_turn_player_id) throw new Error("No active turn.");

  const msLeft =
    new Date(new Date(game.last_move_at).getTime() + TURN_LIMIT_MS).getTime() - Date.now();
  if (msLeft > 0) throw new Error("Turn has not expired yet.");

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

export async function leaveLobby(caller: Caller, roomCode: string) {
  const player = await resolvePlayer(caller);
  const { data: game } = await getSupabaseAdmin()
    .from("wl_games")
    .select("id, status, player1_id, player2_id")
    .eq("room_code", roomCode.toUpperCase())
    .maybeSingle();

  if (!game) return { ok: true }; // already gone
  if (game.status !== "waiting") return { ok: true }; // game started, nothing to undo
  if (game.player2_id !== player.id) return { ok: true }; // not the joiner

  await getSupabaseAdmin().from("wl_games").update({ player2_id: null }).eq("id", game.id);

  return { ok: true };
}
