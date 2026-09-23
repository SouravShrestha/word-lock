import type { SupabaseClient, User } from "@supabase/supabase-js";

export type EmailSignInOutcome =
  | { kind: "link-sent" }
  | { kind: "code-sent" };

export interface AuthAdapter {
  client: SupabaseClient;
  signInWithGoogle?: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<EmailSignInOutcome>;
  verifyEmailCode?: (email: string, code: string) => Promise<void>;
}

export interface AuthContextValue {
  user: User | null;
  isLoggedIn: boolean;
  ready: boolean;
  isLoginRequired: boolean;
  canSignInWithGoogle: boolean;
  usesEmailCode: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<EmailSignInOutcome>;
  verifyEmailCode: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
}
