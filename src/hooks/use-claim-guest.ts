"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "./use-auth";
import { useSession } from "./use-session";
import { claimAccountFn } from "@/lib/game/api.client";

/**
 * Hands this browser's guest games over to the account that just logged in.
 *
 * Runs on sign-in and once per load while logged in, rather than only in the
 * auth callback: the guest session id lives in localStorage, so the server
 * cannot do this on its own, and a player who closes the tab mid-redirect would
 * otherwise never get their games merged.
 *
 * The endpoint is idempotent, and the ref keeps it to one call per
 * account/session pair so a re-render does not re-fire it.
 */
export function useClaimGuest() {
  const { user, ready: authReady } = useAuth();
  const { sessionId, ready: sessionReady } = useSession();
  const queryClient = useQueryClient();

  const claimed = useRef<string | null>(null);

  useEffect(() => {
    if (!authReady || !sessionReady) return;
    if (!user || !sessionId) return;

    const key = `${user.id}:${sessionId}`;
    if (claimed.current === key) return;
    claimed.current = key;

    claimAccountFn({ sessionId })
      .then(() => {
        // Stats, lobby and game views may now be looking at a different player
        // row than the one they cached.
        queryClient.invalidateQueries();
      })
      .catch(() => {
        // A failed merge leaves the guest row untouched, so the next load can
        // retry. Not worth interrupting the player over.
        claimed.current = null;
      });
  }, [authReady, sessionReady, user, sessionId, queryClient]);
}
