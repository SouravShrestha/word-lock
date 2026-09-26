import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

import type { AuthAdapter, EmailSignInOutcome } from "@word-lock/client";

import { supabase } from "@/lib/supabase";

/**
 * The redirect URI used for both Google OAuth and email magic links.
 *
 * On native (iOS/Android) this must be the custom-scheme deep link so the OS
 * can hand the callback back to the app.  On the Expo web target it has to be
 * an HTTPS URL pointing at the web app's /auth/callback route handler.
 *
 * EXPO_PUBLIC_API_URL is the web backend origin (e.g.
 * https://test.wordlock.cbsdev.me or http://<LAN-IP>:3001 during local dev).
 */
function authCallbackUrl(): string {
  if (Platform.OS === "web") {
    const origin = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "") ?? "";
    return `${origin}/auth/callback`;
  }
  return "wordlock://auth/callback";
}

async function signInWithGoogleNative(): Promise<void> {
  const redirectTo = authCallbackUrl();

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
    if (error) {
      throw new Error(error.message);
    }
    return { kind: "code-sent" };
  },

  verifyEmailCode: async (email: string, code: string): Promise<void> => {
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    if (error) throw new Error(error.message);
  },
};
