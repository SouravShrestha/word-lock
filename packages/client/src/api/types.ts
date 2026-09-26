import type { LeagueId } from "@word-lock/core/account";

export interface AccountSummary {
  playerId: string;
  username: string | null;
  usernameLocked: boolean;
  avatar: string;
  joinedAt: string;
  stars: number;
  peakStars: number;
  starGames: number;
  league: LeagueId;
  playStreak: number;
  bestPlayStreak: number;
  lastPlayedOn: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  username: string;
  stars: number;
  league: LeagueId;
}

export interface LeaderboardStanding {
  leagueRank: number;
  stars: number;
  league: LeagueId;
}

export interface LeaderboardView {
  league: LeagueId;
  entries: LeaderboardEntry[];
  me: LeaderboardStanding | null;
}

export interface UsernameAvailability {
  available: boolean;
  reason?: string;
}
