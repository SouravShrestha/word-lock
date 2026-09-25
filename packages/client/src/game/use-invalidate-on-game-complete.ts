"use client";

import { useEffect } from "react";
import type { QueryClient } from "@tanstack/react-query";

/**
 * A finished game changes the player's stars, league and leaderboard rank —
 * refetch those the moment a game completes rather than waiting for their own
 * screens to be revisited. Was duplicated verbatim between the web and mobile
 * game screens.
 */
export function useInvalidateOnGameComplete(isCompleted: boolean, queryClient: QueryClient) {
  useEffect(() => {
    if (!isCompleted) return;
    queryClient.invalidateQueries({ queryKey: ["account"] });
    queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
  }, [isCompleted, queryClient]);
}
