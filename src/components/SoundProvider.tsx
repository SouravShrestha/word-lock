"use client";

import { useEffect } from "react";
import { SoundContext, useSoundState } from "@/hooks/use-sound";

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const sound = useSoundState();
  const { play, primeAll } = sound;

  // Unlock audio playback on the very first user gesture anywhere on the
  // page. Without this, sounds triggered by realtime events with no click
  // in the call stack (opponent's move landing, "your turn", tile locking,
  // game over) get silently blocked by the browser until some button is
  // pressed on that tab.
  // Listeners stay attached (not `once`) because a priming attempt can fail --
  // e.g. the audio files aren't decoded yet. primeAll() is idempotent once it
  // succeeds, so re-running it on later gestures is free.
  useEffect(() => {
    const events: (keyof DocumentEventMap)[] = ["pointerdown", "keydown", "touchstart"];
    events.forEach((event) => document.addEventListener(event, primeAll));
    return () => {
      events.forEach((event) => document.removeEventListener(event, primeAll));
    };
  }, [primeAll]);

  // Global press-sound: every <button> in the app gets a click sound by
  // default. Elements that need a different sound (e.g. keyboard keys, word
  // tiles) opt in via data-sound="key"; data-sound="none" opts out entirely
  // (used when a component already plays its own sound manually).
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const button = target?.closest("button");
      if (!button || button.disabled) return;
      const override = button.dataset.sound;
      if (override === "none") return;
      play(override === "key" ? "key" : "click");
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [play]);

  return <SoundContext.Provider value={sound}>{children}</SoundContext.Provider>;
}
