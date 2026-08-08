// Pure stats aggregation for the player profile page.
// No React, no Supabase, no I/O — takes rows already fetched (and scored) by the caller.
import type { PlayerRow } from "./service.server";

export type GameResult = "win" | "loss" | "draw";

/**
 * Minimal shape needed to derive stats for a single completed game.
 * `scores` mirrors the `scores` field produced by `serializeGame` in
 * service.server.ts (final tile counts per player slot), since raw
 * `GameRow` rows don't carry scores directly — they're derived from the
 * move history via the engine.
 */
export interface StatsGameInput {
  id: string;
  room_code: string;
  player1_id: string;
  player2_id: string | null;
  status: "waiting" | "active" | "completed";
  winner_id: string | null;
  last_move_at: string;
  scores: { 1: number; 2: number };
}

export interface StatsOverview {
  wins: number;
  losses: number;
  draws: number;
  total: number;
}

export interface RecentGameEntry {
  gameId: string;
  roomCode: string;
  opponentId: string | null;
  opponentName: string;
  yourScore: number;
  opponentScore: number;
  result: GameResult;
  completedAt: string;
}

export interface PlayerStats {
  overview: StatsOverview;
  recentGames: RecentGameEntry[];
}

/** Maximum number of recent games kept/returned in a player's profile. */
export const MAX_RECENT_GAMES = 5;

/**
 * Derives win/loss/draw stats and the most recent games (capped at
 * `MAX_RECENT_GAMES`) for `playerId` from a set of completed games and the
 * players involved in them.
 *
 * Games are expected to already be filtered to `status === "completed"` and
 * to only include games where `playerId` is either `player1_id` or
 * `player2_id`. Any other games are ignored defensively.
 */
export function computeStats(
  playerId: string,
  games: StatsGameInput[],
  players: PlayerRow[],
): PlayerStats {
  const playerById = new Map(players.map((p) => [p.id, p]));

  const overview: StatsOverview = { wins: 0, losses: 0, draws: 0, total: 0 };
  const recentGames: RecentGameEntry[] = [];

  for (const game of games) {
    if (game.status !== "completed") continue;
    const isPlayer1 = game.player1_id === playerId;
    const isPlayer2 = game.player2_id === playerId;
    if (!isPlayer1 && !isPlayer2) continue;

    const opponentId = isPlayer1 ? game.player2_id : game.player1_id;
    const opponentName = opponentId
      ? (playerById.get(opponentId)?.display_name ?? "Unknown")
      : "Unknown";

    const yourScore = isPlayer1 ? game.scores[1] : game.scores[2];
    const opponentScore = isPlayer1 ? game.scores[2] : game.scores[1];

    let result: GameResult;
    if (game.winner_id === null) {
      result = "draw";
    } else if (game.winner_id === playerId) {
      result = "win";
    } else {
      result = "loss";
    }

    overview.total++;
    if (result === "win") overview.wins++;
    else if (result === "loss") overview.losses++;
    else overview.draws++;

    recentGames.push({
      gameId: game.id,
      roomCode: game.room_code,
      opponentId,
      opponentName,
      yourScore,
      opponentScore,
      result,
      completedAt: game.last_move_at,
    });
  }

  recentGames.sort((a, b) => b.completedAt.localeCompare(a.completedAt));

  return { overview, recentGames: recentGames.slice(0, MAX_RECENT_GAMES) };
}
