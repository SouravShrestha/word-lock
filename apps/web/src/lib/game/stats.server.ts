import { getSupabaseAdmin } from "@/integrations/supabase/client.server";
import { UNNAMED_PLAYER } from "@word-lock/core/account";
import { resolvePlayer, type Caller } from "./identity.server";
import {
  serializeGame,
  toEngineMoves,
  type GameRow,
  type MoveRow,
  type PlayerRow,
} from "./read.server";
import {
  computeBoardState,
  computeStats,
  MAX_HISTORY_GAMES,
  starHistory,
  type PlayerStats,
  type StatsGameInput,
} from "@word-lock/core/game";

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

export async function getPlayerStats(caller: Caller): Promise<PlayerStats> {
  const player = await resolvePlayer(caller);
  const { data: games } = await getSupabaseAdmin()
    .from("wl_games")
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
    starHistory: starHistory(player.id, statsGames, player.stars, new Date()),
  };
}
