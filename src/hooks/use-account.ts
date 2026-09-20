"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchAccountFn } from "@/lib/game/api.client";
import { browserTimezone } from "@/lib/account/timezone";
import type { LeagueId } from "@/lib/account/leagues";
import { useAuth } from "./use-auth";
import { useSession } from "./use-session";

export interface AccountSummary {
  playerId: string;
  /** The player's only name. Null until they have claimed one. */
  username: string | null;
  usernameLocked: boolean;
  /** Chosen avatar id, e.g. `avatar_01`. Always set. */
  avatar: string;
  stars: number;
  peakStars: number;
  starGames: number;
  /** Derived server-side from `stars`, so every surface reads the same band. */
  league: LeagueId;
  playStreak: number;
  bestPlayStreak: number;
  /** `YYYY-MM-DD` in the player's own timezone. Null until they play. */
  lastPlayedOn: string | null;
}

/**
 * The caller's account row as the server sees it.
 *
 * Keyed on both the session id and the account id, because a sign-in or
 * sign-out changes which player row this resolves to and the previous answer
 * must not be reused.
 */
export function useAccount() {
  const { sessionId, ready: sessionReady } = useSession();
  const { user, ready: authReady } = useAuth();

  return useQuery<AccountSummary>({
    queryKey: ["account", sessionId, user?.id ?? null],
    enabled: sessionReady && authReady && sessionId !== null,
    queryFn: () => fetchAccountFn({ sessionId: sessionId!, timezone: browserTimezone() }),
  });
}
