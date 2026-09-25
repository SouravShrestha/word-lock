"use client";

import { useEffect } from "react";
import type { QueryClient } from "@tanstack/react-query";

import { timeoutGameFn } from "../api/index";

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

    const msLeft = new Date(turnDeadline).getTime() - Date.now();

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
