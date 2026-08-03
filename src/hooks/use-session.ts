"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const SESSION_KEY = "word-lock.session-id";
const NAME_KEY = "word-lock.display-name";
const NAME_SET_KEY = "word-lock.name-set";

const FUN_NAMES = ["WordFox", "TileFox", "GridFox", "WordWiz", "Lexicon"];

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

interface SessionContextValue {
  sessionId: string | null;
  displayName: string;
  isNameSet: boolean;
  ready: boolean;
  setDisplayName: (name: string, markAsSet?: boolean) => void;
}

export const SessionContext = createContext<SessionContextValue | null>(null);

export function useSessionState(): SessionContextValue {
  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(SESSION_KEY);
  });
  const [displayName, setDisplayNameState] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(NAME_KEY) ?? "";
  });
  const [isNameSet, setIsNameSet] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(NAME_SET_KEY) === "1";
  });

  useEffect(() => {
    // Only runs once on mount to create missing values
    let id = sessionId;
    if (!id) {
      id = generateId();
      window.localStorage.setItem(SESSION_KEY, id);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSessionId(id);
    }
    if (!displayName) {
      const name = FUN_NAMES[Math.floor(Math.random() * FUN_NAMES.length)];
      window.localStorage.setItem(NAME_KEY, name);

      setDisplayNameState(name);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setDisplayName = useCallback((name: string, markAsSet = true) => {
    const clean = name.replace(/\s+/g, "").slice(0, 7);
    window.localStorage.setItem(NAME_KEY, clean);
    setDisplayNameState(clean);
    if (markAsSet) {
      window.localStorage.setItem(NAME_SET_KEY, "1");
      setIsNameSet(true);
    }
  }, []);

  return { sessionId, displayName, setDisplayName, isNameSet, ready: sessionId !== null };
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
