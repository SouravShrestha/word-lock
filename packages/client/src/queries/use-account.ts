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
