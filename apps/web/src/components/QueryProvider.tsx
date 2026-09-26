"use client";

import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { useEffect } from "react";
import NProgress from "nprogress";

import { QueryProvider as SharedQueryProvider } from "@word-lock/client";

/**
 * The query client, plus the web's top-loading bar.
 *
 * The client itself and its retry policy are shared — a deliberate 4xx must not
 * be retried, and that reasoning should not be re-derived per platform. What is
 * web-only is driving `nprogress` from the fetch/mutation counts, so it is passed
 * in as the shared provider's `activityTracker` rather than the package learning
 * that nprogress exists.
 *
 * There is no equivalent on mobile: a native app has no navigation progress bar
 * to fill, and pull-to-refresh and per-screen spinners cover the same ground.
 */
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
  return (
    <SharedQueryProvider activityTracker={<ProgressTracker />}>{children}</SharedQueryProvider>
  );
}
