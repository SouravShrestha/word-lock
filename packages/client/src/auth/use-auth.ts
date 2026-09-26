"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { useSession } from "../session/use-session";
import type { AuthAdapter, AuthContextValue, EmailSignInOutcome } from "./adapter";

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuthState(adapter: AuthAdapter): AuthContextValue {
  const { resetSession } = useSession();

  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const { client } = adapter;

  useEffect(() => {
    let active = true;

    client.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setUser(data.session?.user ?? null);
        setReady(true);
      })
      .catch(() => {
        if (active) setReady(true);
      });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [client]);

  const signInWithGoogle = useCallback(async () => {
    if (!adapter.signInWithGoogle) {
      throw new Error(
        "This build does not offer Google sign-in. Check canSignInWithGoogle before calling this.",
      );
    }
    await adapter.signInWithGoogle();
  }, [adapter]);

  const signInWithEmail = useCallback(
    async (email: string): Promise<EmailSignInOutcome> => adapter.signInWithEmail(email),
    [adapter],
  );

  const verifyEmailCode = useCallback(
    async (email: string, code: string) => {
      if (!adapter.verifyEmailCode) {
        throw new Error("This build completes email sign-in by link, not by code.");
      }
      await adapter.verifyEmailCode(email, code);
    },
    [adapter],
  );

  const signOut = useCallback(async () => {
    const { error } = await client.auth.signOut();
    if (error) throw new Error(error.message);
    setUser(null);
    resetSession();
  }, [client, resetSession]);

  return useMemo(
    () => ({
      user,
      isLoggedIn: user !== null,
      ready,
      isLoginRequired: ready && user === null,
      canSignInWithGoogle: adapter.signInWithGoogle !== undefined,
      usesEmailCode: adapter.verifyEmailCode !== undefined,
      signInWithGoogle,
      signInWithEmail,
      verifyEmailCode,
      signOut,
    }),
    [user, ready, adapter, signInWithGoogle, signInWithEmail, verifyEmailCode, signOut],
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
