"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { useClientPlatform } from "../platform";

export const SESSION_KEY = "word-lock.session-id";

const LEGACY_NAME_KEYS = ["word-lock.display-name", "word-lock.name-set"];

export interface SessionContextValue {
  sessionId: string | null;
  ready: boolean;
  resetSession: () => void;
}

export const SessionContext = createContext<SessionContextValue | null>(null);

export function useSessionState(): SessionContextValue {
  const { storage, generateId } = useClientPlatform();

  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      let id = await storage.getItem(SESSION_KEY);
      if (!id) {
        id = generateId();
        await storage.setItem(SESSION_KEY, id);
      }

      await Promise.all(LEGACY_NAME_KEYS.map((key) => storage.removeItem(key)));

      if (active) setSessionId(id);
    })().catch(() => {
      if (active) setSessionId(generateId());
    });

    return () => {
      active = false;
    };
  }, [storage, generateId]);

  const resetSession = useCallback(() => {
    const id = generateId();
    setSessionId(id);
    void storage.setItem(SESSION_KEY, id);
  }, [storage, generateId]);

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
