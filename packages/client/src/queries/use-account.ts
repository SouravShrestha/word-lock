"use client";

import { useQuery } from "@tanstack/react-query";
import { browserTimezone, DEFAULT_AVATAR_ID } from "@word-lock/core/account";
import { BASE_STARS } from "@word-lock/core/game";

import { fetchAccountFn } from "../api/account";
import type { AccountSummary } from "../api/types";
import { useAuth } from "../auth/use-auth";
import { useSession } from "../session/use-session";

export type { AccountSummary };

/**
 * What a logged-out caller sees: a fresh account. A guest row can still carry
 * stars, a streak or an avatar from before sign-out, and none of that is
 * theirs to show until they log back in.
 */
export function loggedOutSummary(summary: AccountSummary): AccountSummary {
  return {
    ...summary,
    avatar: DEFAULT_AVATAR_ID,
    stars: BASE_STARS,
    peakStars: BASE_STARS,
    playStreak: 0,
    bestPlayStreak: 0,
    lastPlayedOn: null,
    lastFreezeOn: null,
  };
}

export function useAccount() {
  const { sessionId, ready: sessionReady } = useSession();
  const { user, ready: authReady } = useAuth();

  return useQuery<AccountSummary>({
    queryKey: ["account", sessionId, user?.id ?? null],
    enabled: sessionReady && authReady && sessionId !== null,
    queryFn: () => fetchAccountFn({ sessionId: sessionId!, timezone: browserTimezone() }),
    select: user ? undefined : loggedOutSummary,
  });
}

/**
 * Whether the caller may take a seat in a game: signed in *and* named. The
 * login and username sheets already wall off every screen, but a screen that
 * mounts behind them (an invite link opened logged out) still runs its
 * effects, so anything that writes on the caller's behalf waits on this
 * rather than on the session id alone.
 */
export function useHasPlayableAccount(): boolean {
  const { isLoggedIn, ready: authReady } = useAuth();
  const { data: account } = useAccount();
  return authReady && isLoggedIn && !!account?.username;
}
