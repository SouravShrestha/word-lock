import type { PlayerRow } from "./rows";
import type { StarPoint } from "./star-history";

export type GameResult = "win" | "loss" | "draw";

export interface StatsGameInput {
  id: string;
  room_code: string;
  player1_id: string;
  player2_id: string | null;
  status: "waiting" | "active" | "completed";
  winner_id: string | null;
  last_move_at: string;
  p1_star_delta: number | null;
  p2_star_delta: number | null;
  p1_stars_after: number | null;
  p2_stars_after: number | null;
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
  opponentAvatar: string | null;
  yourScore: number;
  opponentScore: number;
  result: GameResult;
  completedAt: string;
  starDelta: number | null;
}

export interface PlayerRecord {
  overview: StatsOverview;
  recentGames: RecentGameEntry[];
}

export interface PlayerStats extends PlayerRecord {
  starHistory: StarPoint[];
}

export const MAX_RECENT_GAMES = 5;
export const MAX_HISTORY_GAMES = 50;

export function computeStats(
  playerId: string,
  games: StatsGameInput[],
  players: PlayerRow[],
): PlayerRecord {
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

  return { overview, recentGames: recentGames.slice(0, MAX_HISTORY_GAMES) };
}
