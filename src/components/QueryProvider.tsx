"use client";

import {
  QueryClient,
  QueryClientProvider,
  useIsFetching,
  useIsMutating,
} from "@tanstack/react-query";
import { useState, useEffect } from "react";
import NProgress from "nprogress";

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
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <ProgressTracker />
      {children}
    </QueryClientProvider>
  );
}
