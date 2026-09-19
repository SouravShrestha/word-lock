"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchLeaderboardFn } from "@/lib/game/api.client";
import type { LeagueId } from "@/lib/account/leagues";
import { useAuth } from "./use-auth";

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
  /** The band `entries` covers, and the viewer's own band. */
  league: LeagueId;
  entries: LeaderboardEntry[];
  me: LeaderboardStanding | null;
}

/**
 * The top of the viewer's own league band, plus the viewer's own standing.
 *
 * Keyed on the account id, so a signed-in result is never served to someone who
 * has since signed out.
 */
export function useLeaderboard() {
  const { user, ready } = useAuth();

  return useQuery<LeaderboardView>({
    queryKey: ["leaderboard", user?.id ?? null],
    enabled: ready,
    queryFn: () => fetchLeaderboardFn(),
    // Stars only move when a game finishes, so this does not need to be fresh to
    // the second.
    staleTime: 60_000,
  });
}
