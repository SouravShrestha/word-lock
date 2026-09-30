"use client";

import { useEffect } from "react";
import type { QueryClient } from "@tanstack/react-query";

import { CLOCK_GRACE_MS } from "@word-lock/core/game";

import { timeoutGameFn } from "../api/index";

/**
 * The server only treats a turn as expired once its grace period is over too,
 * so firing at the deadline itself would be rejected and never retried.
 */
export const SWEEP_DELAY_MS = CLOCK_GRACE_MS + 500;

/**
 * Fires `timeoutGameFn` the moment a game's turn deadline passes (or
 * immediately, if it already has) so an inactive opponent's turn gets swept
 * without waiting for the server's own cron sweep. Was duplicated verbatim
 * between the web and mobile game screens.
 */
export function useSweepTimer(options: {
  status: string | undefined;
  turnDeadline: string | null | undefined;
  sessionId: string | null;
  roomCode: string;
  queryClient: QueryClient;
  queryKey: unknown[];
}) {
  const { status, turnDeadline, sessionId, roomCode, queryClient, queryKey } = options;

  useEffect(() => {
    if (status !== "active" || !turnDeadline) return;

    const msLeft = new Date(turnDeadline).getTime() + SWEEP_DELAY_MS - Date.now();

    const trigger = () => {
      if (!sessionId) return;
      timeoutGameFn({ sessionId, roomCode })
        .then(() => queryClient.invalidateQueries({ queryKey }))
        .catch(() => {});
    };

    if (msLeft <= 0) {
      trigger();
      return;
    }

    const timer = setTimeout(trigger, msLeft);
    return () => clearTimeout(timer);
  }, [status, turnDeadline, sessionId, roomCode, queryClient, queryKey]);
}
