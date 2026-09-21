"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createContext, useContext } from "react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { safeNextPath } from "@/lib/auth/redirect";
import { useSession } from "./use-session";

/**
 * Auth layer for the app.
 *
 * An account is required to play. There is no guest mode and no per-surface
 * gating: the moment the session lookup resolves without a user, `AuthSheet`
 * covers the app and stays there until they log in. That makes `isLoginRequired`
 * the single piece of state the UI needs — nothing calls "open the login sheet"
 * any more, because being logged out *is* the open state.
 *
 * `use-session.ts` still exists, but only for the local in-game display name.
 * It is no longer an identity of its own.
 */

export interface AuthContextValue {
  /** The verified account, or null when logged out. */
  user: User | null;
  isLoggedIn: boolean;
  /**
   * False until the initial session lookup resolves. UI that gates on this must
   * not assume "not ready" means "logged out".
   */
  ready: boolean;
  /**
   * The session has resolved and there is no account, so the login sheet owns
   * the screen. Derived, not stored — there is nothing to open or close.
   */
  isLoginRequired: boolean;
  /** Starts the Google redirect. Resolves only if the redirect fails to begin. */
  signInWithGoogle: () => Promise<void>;
  /** Sends a magic link. Resolves once the email is accepted for delivery. */
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Absolute URL for `/auth/callback`, carrying the page the player was on so
 * they come back to it rather than being dumped on the home screen.
 *
 * Prefers the configured site URL because it has to match the redirect
 * allow-list in the Supabase dashboard exactly; `window.location.origin` is a
 * fallback for local work where the variable may be unset.
 */
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

export function useAuthState(): AuthContextValue {
  const { resetSession } = useSession();

  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    /*
     * getSession reads the cookie without a round trip, which is what we want
     * on mount: it is fast, and the token has already been verified by the
     * middleware on this navigation. Anything that actually trusts the identity
     * re-verifies it server-side via getVerifiedUser.
     */
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setUser(data.session?.user ?? null);
        setReady(true);
      })
      .catch(() => {
        // Treat an unreachable auth server as "guest" rather than blocking the
        // app on a spinner forever.
        if (active) setReady(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl() },
    });
    if (error) throw new Error(error.message);
  }, []);

  const signInWithEmail = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl(), shouldCreateUser: true },
    });
    if (error) throw new Error(error.message);
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    setUser(null);
    /*
     * Clears the local display name and session id along with the account, so
     * the next person to log in on this browser does not inherit the previous
     * player's in-game name. This matters on a shared device.
     */
    resetSession();
  }, [resetSession]);

  return useMemo(
    () => ({
      user,
      isLoggedIn: user !== null,
      ready,
      isLoginRequired: ready && user === null,
      signInWithGoogle,
      signInWithEmail,
      signOut,
    }),
    [user, ready, signInWithGoogle, signInWithEmail, signOut],
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
