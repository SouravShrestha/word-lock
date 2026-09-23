"use client";

import { AuthProvider as SharedAuthProvider } from "@word-lock/client";

import { webAuthAdapter } from "@/lib/auth-adapter";

/**
 * Auth state, over the web's redirect-and-cookie sign-in flow.
 *
 * The guest-history merge runs inside the shared provider, so nothing extra is
 * needed here.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SharedAuthProvider adapter={webAuthAdapter}>{children}</SharedAuthProvider>;
}
