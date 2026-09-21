"use client";

import { AuthContext, useAuthState } from "@/hooks/use-auth";
import { useClaimGuest } from "@/hooks/use-claim-guest";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthState();

  return (
    <AuthContext.Provider value={auth}>
      <GuestClaim />
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Runs the guest-history merge as a child, because the hook reads `useAuth` and
 * so has to sit inside the provider it depends on. Renders nothing.
 */
function GuestClaim() {
  useClaimGuest();
  return null;
}
