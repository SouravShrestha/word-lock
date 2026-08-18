"use client";

import { useEffect } from "react";
import { SoundContext, useSoundState } from "@/hooks/use-sound";

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const sound = useSoundState();
  const { play } = sound;

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
