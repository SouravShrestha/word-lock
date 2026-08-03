"use client";

import { SessionContext, useSessionState } from "@/hooks/use-session";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const session = useSessionState();
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}
