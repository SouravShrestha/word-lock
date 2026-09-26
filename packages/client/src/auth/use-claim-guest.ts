"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { claimAccountFn } from "../api/account";
import { useSession } from "../session/use-session";
import { useAuth } from "./use-auth";

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
        queryClient.invalidateQueries();
      })
      .catch(() => {
        claimed.current = null;
      });
  }, [authReady, sessionReady, user, sessionId, queryClient]);
}
