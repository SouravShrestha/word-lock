// Server-only Word-lock game service. Holds all trusted game logic.
//
// Identity is never taken from a raw session id here. Every entry point receives
// a `Caller` built by `resolveCaller` in the route handler, and resolves it via
// `resolvePlayer`, so a logged-in player is identified by their verified account
// rather than by whatever the request body claimed.
import { getSupabaseAdmin } from "@/integrations/supabase/client.server";
import { PublicError } from "@/lib/http/errors";
import { UNNAMED_PLAYER } from "@/lib/account/names";
import { resolvePlayer, type Caller } from "./identity.server";
import { touchPlayStreak } from "./streak.server";
import { computeStarOutcome, UNRANKED_OUTCOME } from "./stars.server";
import { getDictionary, isWord } from "./dictionary.server";
import {
  computeBoardState,
  generateGrid,
  validateMove,
  MOVE_REJECTION_MESSAGES,
  type EngineMove,
  type PlayerSlot,
} from "./engine";
import { computeStats, MAX_HISTORY_GAMES, type PlayerStats, type StatsGameInput } from "./stats";
import { starHistory } from "./star-history";
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
    /*
     * Every move in order, tiles included. `playedWords` above is the readable
     * strip; this is the replayable record — the client re-runs `computeBoardState`
     * over a prefix of it to draw the board as it stood at an earlier turn, which
     * is only possible because the tiles travel with the word.
     */
    history: moves.map((m) => ({
      id: m.id,
      word: m.word,
      passed: m.passed,
      playerId: m.player_id,
      tileIndices: m.tile_indices ?? [],
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
    throw new PublicError(
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
  throw new PublicError("Couldn't allocate a room code. Try again.");
}

export async function joinGame(caller: Caller, roomCode: string) {
  const player = await resolvePlayer(caller);
  const loaded = await loadGame(roomCode);
  if (!loaded) throw new PublicError("No game found with that code.");
  const { game } = loaded;

  if (game.player1_id === player.id || game.player2_id === player.id) {
    return { roomCode: game.room_code };
  }
  if (game.player2_id) throw new PublicError("That game is already full.");
  if (game.status === "completed") throw new PublicError("That game is already finished.");
  if ((await countActiveGames(player.id)) >= MAX_ACTIVE_GAMES) {
    throw new PublicError(
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

  if (!game) throw new PublicError("Game not found.");
  if (game.player1_id !== player.id) throw new PublicError("Only the host can start the game.");
  if (game.status !== "waiting") throw new PublicError("Game is not in the waiting state.");
  if (!game.player2_id) throw new PublicError("Waiting for an opponent to join.");

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

  if (!game) throw new PublicError("Game not found.");
  if (game.status !== "active") throw new PublicError("This game isn't active.");

  const isPlayer1 = game.player1_id === player.id;
  const isPlayer2 = game.player2_id === player.id;
  if (!isPlayer1 && !isPlayer2) throw new PublicError("You are not a participant in this game.");

  const winnerId = isPlayer1 ? game.player2_id : game.player1_id;

  // A forfeit is a real result, so it moves stars like any other completion. The
  // full row is needed for the star calculation, which the narrow select above
  // does not provide.
  const loaded = await loadGame(roomCode);
  const { outcome, commit } = loaded
    ? await computeStarOutcome(loaded.game, winnerId)
    : { outcome: UNRANKED_OUTCOME, commit: async () => {} };

  const { data: completed } = await getSupabaseAdmin()
    .from("wl_games")
    .update({
      status: "completed",
      winner_id: winnerId,
      end_reason: "forfeit",
      last_move_at: new Date().toISOString(),
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

  return { ok: true };
}

/**
 * Atomically claims the current turn before a move is recorded.
 *
 * `validateMove`/the checks above only *read* `current_turn_player_id` —
 * nothing stopped two requests that both read the same turn from also both
 * inserting a move for it, letting a player (or a client retry, or the sweep
 * cron racing a live request) take two turns in a row. This closes that gap
 * without a schema change: `last_move_at` already changes on every turn, so
 * using it as an optimistic-lock version stamp — the update only matches rows
 * that still have the exact timestamp this caller loaded — means only the
 * first of two racing writers can ever claim the turn. The loser sees no row
 * come back and stops before touching `wl_moves`.
 */
async function claimTurn(game: GameRow, expectedPlayerId: string): Promise<string> {
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
        p1_stars_after: outcome.p1StarsAfter,
        p2_stars_after: outcome.p2StarsAfter,
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
  // A pass is still a turn taken, so it counts toward the daily streak.
  await touchPlayStreak(player, caller.timezone);
  return { ok: true };
}

/**
 * Broadcasts a reaction emoji to both players in a game.
 *
 * Purely ephemeral: nothing is written to `wl_games` or `wl_moves`, so a
 * reaction never appears in history or survives a refresh. The only trust
 * decision here is authorization — the caller must resolve to one of the two
 * seats in a game that has actually started — since the emoji itself is
 * already constrained to a fixed set by the route's schema.
 */
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
    // Never subscribed, so there is nothing to unsubscribe — just drop the
    // client-side handle rather than leaking it for the life of the request.
    await getSupabaseAdmin().removeChannel(channel);
  }

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

/**
 * Everything the profile and history screens read: the win/loss record, a page
 * of finished games, and the star curve.
 *
 * All three come off one query. Every completed game is fetched because the
 * record counts them all and the curve is drawn across all of them — but only
 * the {@link MAX_HISTORY_GAMES} newest need move history (to compute final board
 * scores) and opponent names, which are by far the expensive parts.
 */
export async function getPlayerStats(caller: Caller): Promise<PlayerStats> {
  const player = await resolvePlayer(caller);
  const { data: games } = await getSupabaseAdmin()
    .from("wl_games")
    /*
     * Every completed game is fetched (see the doc comment above), so this
     * list is unbounded by a heavy player's game count — all the more reason
     * not to pull the whole row. `end_reason` and `current_turn_player_id`
     * are meaningless on a completed game and never read by `computeStats`/
     * `starHistory` anyway; `grid` is kept because the recent-games branch
     * below needs it to replay final scores.
     */
    .select(
      "id, room_code, grid, player1_id, player2_id, status, winner_id, last_move_at, p1_star_delta, p2_star_delta, p1_stars_after, p2_stars_after",
    )
    .eq("status", "completed")
    .or(`player1_id.eq.${player.id},player2_id.eq.${player.id}`)
    .order("last_move_at", { ascending: false });

  const rows = (games ?? []) as GameRow[];
  const recentRows = rows.slice(0, MAX_HISTORY_GAMES);
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
      p1_stars_after: game.p1_stars_after,
      p2_stars_after: game.p2_stars_after,
      scores,
    };
  });

  return {
    ...computeStats(player.id, statsGames, people_),
    // Built from every row, not just the page of history, and anchored on the
    // player's live star total so the line ends where the headline says it does.
    starHistory: starHistory(player.id, statsGames, player.stars, new Date()),
  };
}

/*
 * Caps a single sweep invocation two ways:
 *  - SWEEP_BATCH_LIMIT bounds how many stale games one cron firing will touch,
 *    so a large backlog drains over a few 30-minute cycles instead of risking
 *    the Worker's per-invocation CPU/subrequest ceiling in one run.
 *  - SWEEP_CONCURRENCY bounds how many of those run at once. Each game is
 *    3-4 sequential round trips (claim, load moves, insert, advance) that
 *    cannot be parallelised *within* a game, but nothing ties one game's
 *    sweep to another's, so running the previous version's for-loop fully
 *    sequentially — one game's four round trips finishing before the next
 *    game's first one even starts — bought no correctness, only latency.
 */
const SWEEP_BATCH_LIMIT = 50;
const SWEEP_CONCURRENCY = 5;

/**
 * Auto-passes one expired turn. Returns whether it actually did — `false`
 * covers both "nothing to do" and "lost the race to claim the turn", which
 * `sweepExpiredTurns` only needs a count of, not which one happened.
 */
async function sweepOneGame(game: GameRow): Promise<boolean> {
  if (!game.current_turn_player_id) return false;

  // A client tab timing out the same turn (see `timeoutGame`) can race this
  // job. Losing the claim just means someone else already handled it.
  try {
    await claimTurn(game, game.current_turn_player_id);
  } catch {
    return false;
  }

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
  if (!inserted) return false;

  await finishOrAdvance(game, [...((moves ?? []) as MoveRow[]), inserted as MoveRow]);
  return true;
}

/** Auto-passes any active game whose current turn has run past 24 hours. */
export async function sweepExpiredTurns() {
  const cutoff = new Date(Date.now() - TURN_LIMIT_MS).toISOString();
  const { data: games } = await getSupabaseAdmin()
    .from("wl_games")
    .select("*")
    .eq("status", "active")
    .lt("last_move_at", cutoff)
    .limit(SWEEP_BATCH_LIMIT);

  const rows = (games ?? []) as GameRow[];
  let swept = 0;

  for (let i = 0; i < rows.length; i += SWEEP_CONCURRENCY) {
    const batch = rows.slice(i, i + SWEEP_CONCURRENCY);
    const results = await Promise.all(batch.map(sweepOneGame));
    swept += results.filter(Boolean).length;
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
    /*
     * Any client with the tab open can call this, and the sweep cron polls
     * the same expired turns — so losing this race just means someone else
     * (another tab, or the cron) already advanced the turn. That is the
     * outcome this call wanted anyway, so it is a success, not an error.
     */
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
