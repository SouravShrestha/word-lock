"use client";

import { useQuery } from "@tanstack/react-query";
import { browserTimezone } from "@word-lock/core/account";

import { fetchAccountFn } from "../api/account";
import type { AccountSummary } from "../api/types";
import { useAuth } from "../auth/use-auth";
import { useSession } from "../session/use-session";

export type { AccountSummary };

export function useAccount() {
  const { sessionId, ready: sessionReady } = useSession();
  const { user, ready: authReady } = useAuth();

  return useQuery<AccountSummary>({
    queryKey: ["account", sessionId, user?.id ?? null],
    enabled: sessionReady && authReady && sessionId !== null,
    queryFn: () => fetchAccountFn({ sessionId: sessionId!, timezone: browserTimezone() }),
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
