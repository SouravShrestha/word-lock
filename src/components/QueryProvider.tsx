"use client";

import {
  QueryClient,
  QueryClientProvider,
  useIsFetching,
  useIsMutating,
} from "@tanstack/react-query";
import { useState, useEffect } from "react";
import NProgress from "nprogress";

import { ApiError } from "@/lib/game/api.client";

/**
 * A deliberate 4xx ("it's not your turn yet", a bad session id) is not a
 * transient failure — retrying it just delays the client from showing the
 * real error. Only a 5xx (or a network failure, which throws a non-`ApiError`
 * and always retries) gets the default backoff, capped at 2 attempts rather
 * than the library default of 3.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status < 500) return false;
  return failureCount < 2;
}

function ProgressTracker() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  useEffect(() => {
    if (isFetching > 0 || isMutating > 0) {
      NProgress.start();
    } else {
      NProgress.done();
    }
  }, [isFetching, isMutating]);

  return null;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // The game screen and account summary set their own
            // `refetchInterval` where polling matters; everywhere else, a
            // few seconds of staleness saves a request on every remount
            // (switching tabs, opening a sheet) without the data ever
            // looking obviously wrong.
            staleTime: 10_000,
            retry: shouldRetry,
          },
          /*
           * Mutations keep the library default of no retry. Every mutation
           * here (move, pass, forfeit, create, ...) is a real game action —
           * if a response is lost after the server already applied it, an
           * automatic retry would resubmit it. `claimTurn` in
           * `service.server.ts` stops that from corrupting game state, but
           * the player would still see a confusing "someone else already
           * took this turn" for their own successful move. Failed mutations
           * already surface to the player to retry explicitly.
           */
        },
      }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <ProgressTracker />
      {children}
    </QueryClientProvider>
  );
}
