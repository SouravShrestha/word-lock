"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { AuthContext, useAuthState } from "./auth/use-auth";
import { useClaimGuest } from "./auth/use-claim-guest";
import type { AuthAdapter } from "./auth/adapter";
import { ClientPlatformContext, type ClientPlatform } from "./platform";
import { QUERY_DEFAULTS } from "./queries/retry";
import { SessionContext, useSessionState } from "./session/use-session";

export function ClientPlatformProvider({
  platform,
  children,
}: {
  platform: ClientPlatform;
  children: ReactNode;
}) {
  return (
    <ClientPlatformContext.Provider value={platform}>{children}</ClientPlatformContext.Provider>
  );
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const session = useSessionState();
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function AuthProvider({ adapter, children }: { adapter: AuthAdapter; children: ReactNode }) {
  const auth = useAuthState(adapter);

  return (
    <AuthContext.Provider value={auth}>
      <GuestClaim />
      {children}
    </AuthContext.Provider>
  );
}

function GuestClaim() {
  useClaimGuest();
  return null;
}

export function QueryProvider({
  children,
  activityTracker,
}: {
  children: ReactNode;
  activityTracker?: ReactNode;
}) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: QUERY_DEFAULTS } }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {activityTracker}
      {children}
    </QueryClientProvider>
  );
}
