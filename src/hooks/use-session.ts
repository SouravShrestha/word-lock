"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const SESSION_KEY = "word-lock.session-id";

/**
 * Keys this hook used to own, back when the in-game name was a separate thing
 * kept in localStorage. The name is the account's `username` now, so these are
 * cleared on sight to stop a stale value sitting in storage forever.
 */
const LEGACY_NAME_KEYS = ["word-lock.display-name", "word-lock.name-set"];

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * The browser's session id.
 *
 * This is not an identity. A logged-in caller is identified server-side by their
 * verified `user_id`; the session id only exists so a row can be created before
 * sign-in and adopted by `wl_claim_player` afterwards. It carries no name — the
 * account's `username` is the one name a player has.
 */
interface SessionContextValue {
  sessionId: string | null;
  ready: boolean;
  /** Discards the current guest identity and mints a fresh one. */
  resetSession: () => void;
}

export const SessionContext = createContext<SessionContextValue | null>(null);

export function useSessionState(): SessionContextValue {
  /*
   * This deliberately starts null rather than reading localStorage in the
   * useState initialiser. On the server the initialiser can only return null,
   * so a client initialiser that returns a stored id produces a hydration
   * mismatch — and React does not repair mismatched DOM *attributes* during
   * hydration, it keeps whatever the server emitted. That left server-rendered
   * `disabled` attributes (e.g. the New game button, gated on `ready`) stuck on
   * after a refresh. Reading storage in an effect instead means the first
   * client render matches the server, and the follow-up state update is a real
   * re-render that does patch attributes.
   */
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    let id = window.localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = generateId();
      window.localStorage.setItem(SESSION_KEY, id);
    }

    LEGACY_NAME_KEYS.forEach((key) => window.localStorage.removeItem(key));

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessionId(id);
  }, []);

  /**
   * Called on sign-out. Mints a brand new guest identity rather than restoring
   * the one used before logging in, so the games played while signed in are not
   * left reachable by the next person to use the browser.
   */
  const resetSession = useCallback(() => {
    const id = generateId();
    window.localStorage.setItem(SESSION_KEY, id);
    setSessionId(id);
  }, []);

  return {
    sessionId,
    ready: sessionId !== null,
    resetSession,
  };
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
