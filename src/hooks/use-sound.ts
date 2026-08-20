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

// Number of pre-created <audio> elements kept per sound. Overlapping triggers
// (opponent's word + tile lock + "your turn" can all land in the same tick)
// rotate through the pool instead of cutting each other off.
const POOL_SIZE = 3;

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
  // A small pool of <audio> elements per sound. These exact elements are the
  // ones primeAll() unlocks during a user gesture and the ones play() reuses
  // afterwards -- browsers gate autoplay per element, so a freshly created or
  // cloned node would be blocked even after priming.
  const poolRef = useRef<Partial<Record<SoundName, HTMLAudioElement[]>>>({});
  const primedRef = useRef(false);
  // Elements currently mid-priming. The first gesture primes and plays a click
  // sound at the same time, so priming must never pause an element that play()
  // has since taken over.
  const primingRef = useRef<WeakSet<HTMLAudioElement>>(new WeakSet());

  const getPool = useCallback((name: SoundName) => {
    let pool = poolRef.current[name];
    if (!pool) {
      pool = Array.from({ length: POOL_SIZE }, () => {
        const el = new Audio(SOUND_FILES[name]);
        el.preload = "auto";
        return el;
      });
      poolRef.current[name] = pool;
    }
    return pool;
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
        const pool = getPool(name);
        // Prefer an idle element that isn't mid-priming; otherwise steal the first.
        const el =
          pool.find(
            (candidate) =>
              (candidate.paused || candidate.ended) && !primingRef.current.has(candidate),
          ) ?? pool[0];
        // Claim it so a pending priming callback won't pause it underneath us.
        primingRef.current.delete(el);
        el.muted = false;
        el.volume = 1;
        el.currentTime = 0;
        // Missing/undecodable files reject the play() promise -- swallow it so
        // gameplay never breaks while sound assets are still being sourced.
        void el.play().catch(() => {});
      } catch {
        // Ignore playback errors.
      }
    },
    [muted, getPool],
  );

  // Browsers block audio.play() until the page has received a user gesture,
  // and the permission is granted per <audio> element. Realtime-driven sounds
  // (opponent moved, your turn, lock, game over) fire with no gesture in the
  // call stack, so without priming they get silently blocked on a tab that
  // hasn't been touched. Called from a real gesture handler: start every
  // pooled element unmuted at volume 0 and pause it again immediately, which
  // marks each element as user-activated for later programmatic play() calls.
  const primeAll = useCallback(() => {
    if (primedRef.current || typeof window === "undefined") return;
    primedRef.current = true;
    (Object.keys(SOUND_FILES) as SoundName[]).forEach((name) => {
      getPool(name).forEach((el) => {
        // Unmuted playback is what actually lifts the per-element gate in
        // WebKit; volume 0 keeps the priming inaudible.
        el.muted = false;
        el.volume = 0;
        primingRef.current.add(el);
        const settle = () => {
          // play() took this element over in the meantime -- leave it alone.
          if (!primingRef.current.has(el)) return;
          primingRef.current.delete(el);
          el.pause();
          el.currentTime = 0;
          el.volume = 1;
        };
        try {
          const started = el.play();
          if (started) {
            started.then(settle).catch(() => {
              settle();
              // Allow a retry on the next gesture.
              primedRef.current = false;
            });
          } else {
            settle();
          }
        } catch {
          settle();
          primedRef.current = false;
        }
      });
    });
  }, [getPool]);

  return { muted, toggleMuted, play, primeAll };
}

export function useSound(): SoundContextValue {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error("useSound must be used inside <SoundProvider>");
  return ctx;
}
