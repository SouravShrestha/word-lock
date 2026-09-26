"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchLeaderboardFn } from "../api/account";
import type { LeaderboardEntry, LeaderboardStanding, LeaderboardView } from "../api/types";
import { useAuth } from "../auth/use-auth";

export type { LeaderboardEntry, LeaderboardStanding, LeaderboardView };

export function useLeaderboard() {
  const { user, ready } = useAuth();

  return useQuery<LeaderboardView>({
    queryKey: ["leaderboard", user?.id ?? null],
    enabled: ready,
    queryFn: () => fetchLeaderboardFn(),
    staleTime: 60_000,
  });
}
