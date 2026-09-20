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
  /** Star movement per slot. Null on an unranked game, or before completion. */
  p1_star_delta: number | null;
  p2_star_delta: number | null;
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
  /**
   * The opponent's chosen avatar id. Null only when the opponent row could not
   * be found at all, which the row renders as the default face.
   */
  opponentAvatar: string | null;
  yourScore: number;
  opponentScore: number;
  result: GameResult;
  completedAt: string;
  /**
   * Stars this game moved for the viewer, or null if it was unranked — which is
   * how the row decides whether to show a delta rather than a misleading zero.
   */
  starDelta: number | null;
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
    const opponent = opponentId ? playerById.get(opponentId) : undefined;
    const opponentName = opponent?.username ?? "Unknown";
    const opponentAvatar = opponent?.avatar ?? null;

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
      opponentAvatar,
      yourScore,
      opponentScore,
      result,
      completedAt: game.last_move_at,
      starDelta: isPlayer1 ? game.p1_star_delta : game.p2_star_delta,
    });
  }

  recentGames.sort((a, b) => b.completedAt.localeCompare(a.completedAt));

  return { overview, recentGames: recentGames.slice(0, MAX_RECENT_GAMES) };
}
