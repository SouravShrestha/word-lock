import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

import type { AuthAdapter, EmailSignInOutcome } from "@word-lock/client";

import { supabase } from "@/lib/supabase";

async function signInWithGoogleNative(): Promise<void> {
  const redirectTo = AuthSession.makeRedirectUri({ scheme: "wordlock", path: "auth/callback" });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });
  if (error) throw new Error(error.message);
  if (!data.url) throw new Error("Google sign-in did not return a URL to open.");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success") {
    return;
  }

  const url = new URL(result.url);
  const code = url.searchParams.get("code");
  if (!code) {
    throw new Error("Google sign-in did not return an authorization code.");
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw new Error(exchangeError.message);
}

export const nativeAuthAdapter: AuthAdapter = {
  client: supabase,
  signInWithGoogle: Platform.OS === "ios" ? undefined : signInWithGoogleNative,

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
