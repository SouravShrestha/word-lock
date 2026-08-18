"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

const MUTED_KEY = "word-lock.sound-muted";

export type SoundName =
  | "click"
  | "key"
  | "backspace"
  | "success"
  | "error"
  | "lock"
  | "pass"
  | "your-turn"
  | "opponent-joined"
  | "game-start"
  | "win"
  | "lose"
  | "draw";

const SOUND_FILES: Record<SoundName, string> = {
  click: "/sounds/click.mp3",
  key: "/sounds/key.mp3",
  backspace: "/sounds/backspace.mp3",
  success: "/sounds/success.mp3",
  error: "/sounds/error.mp3",
  lock: "/sounds/lock.mp3",
  pass: "/sounds/pass.mp3",
  "your-turn": "/sounds/your-turn.mp3",
  "opponent-joined": "/sounds/opponent-joined.mp3",
  "game-start": "/sounds/game-start.mp3",
  win: "/sounds/win.mp3",
  lose: "/sounds/lose.mp3",
  draw: "/sounds/draw.mp3",
};

interface SoundContextValue {
  muted: boolean;
  toggleMuted: () => void;
  play: (name: SoundName) => void;
  primeAll: () => void;
}

export const SoundContext = createContext<SoundContextValue | null>(null);

export function useSoundState(): SoundContextValue {
  const [muted, setMuted] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(MUTED_KEY) === "1";
  });
  // Cache one <audio> element per sound so the browser only fetches/decodes it once.
  // Each play() clones the node so overlapping/rapid triggers don't cut each other off.
  const cacheRef = useRef<Partial<Record<SoundName, HTMLAudioElement>>>({});
  const primedRef = useRef(false);

  const getOrCreate = useCallback((name: SoundName) => {
    let base = cacheRef.current[name];
    if (!base) {
      base = new Audio(SOUND_FILES[name]);
      base.preload = "auto";
      cacheRef.current[name] = base;
    }
    return base;
  }, []);

  const toggleMuted = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      window.localStorage.setItem(MUTED_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  const play = useCallback(
    (name: SoundName) => {
      if (muted || typeof window === "undefined") return;
      try {
        const base = getOrCreate(name);
        const instance = base.cloneNode(true) as HTMLAudioElement;
        instance.volume = 1;
        // Missing/undecodable files reject the play() promise -- swallow it so
        // gameplay never breaks while sound assets are still being sourced.
        void instance.play().catch(() => {});
      } catch {
        // Ignore playback errors.
      }
    },
    [muted, getOrCreate],
  );

  // Browsers block audio.play() until the page has received a user gesture.
  // Realtime-driven sounds (opponent moved, your turn, lock, game over) can
  // fire with no gesture in the call stack, so they'd silently get blocked
  // forever on a tab that hasn't been touched yet. Call this once on the
  // first pointerdown/keydown/touchstart anywhere on the page to "unlock"
  // every sound (play + immediately pause/rewind at ~0 volume) while a
  // gesture is active, so later programmatic play() calls succeed.
  const primeAll = useCallback(() => {
    if (primedRef.current || typeof window === "undefined") return;
    primedRef.current = true;
    (Object.keys(SOUND_FILES) as SoundName[]).forEach((name) => {
      const base = getOrCreate(name);
      const instance = base.cloneNode(true) as HTMLAudioElement;
      instance.muted = true;
      instance
        .play()
        .then(() => {
          instance.pause();
          instance.currentTime = 0;
        })
        .catch(() => {
          // If even the muted priming play fails, allow a retry on the next gesture.
          primedRef.current = false;
        });
    });
  }, [getOrCreate]);

  return { muted, toggleMuted, play, primeAll };
}

export function useSound(): SoundContextValue {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error("useSound must be used inside <SoundProvider>");
  return ctx;
}
