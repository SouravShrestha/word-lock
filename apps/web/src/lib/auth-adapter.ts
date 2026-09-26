"use client";

import type { AuthAdapter, EmailSignInOutcome } from "@word-lock/client";
import { safeNextPath } from "@word-lock/core/auth";

import { supabase } from "@/integrations/supabase/client";

function callbackUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  const origin = configured || window.location.origin;
  const url = new URL("/auth/callback", origin);
  url.searchParams.set(
    "next",
    safeNextPath(`${window.location.pathname}${window.location.search}`),
  );
  return url.toString();
}

export const webAuthAdapter: AuthAdapter = {
  client: supabase,

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl() },
    });
    if (error) throw new Error(error.message);
  },

  signInWithEmail: async (email: string): Promise<EmailSignInOutcome> => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) throw new Error(error.message);
    return { kind: "code-sent" };
  },

  verifyEmailCode: async (email: string, code: string): Promise<void> => {
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    if (error) throw new Error(error.message);
  },
};
