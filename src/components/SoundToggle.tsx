"use client";

import { Volume2, VolumeX } from "@/components/icons";
import { useSound } from "@/hooks/use-sound";

export function SoundToggle() {
  const { muted, toggleMuted } = useSound();

  return (
    <button
      type="button"
      onClick={toggleMuted}
      aria-label={muted ? "Unmute sound" : "Mute sound"}
      className="chunky-btn grid h-10 w-10 place-items-center bg-card text-foreground"
    >
      {muted ? (
        <VolumeX className="h-5 w-5" aria-hidden />
      ) : (
        <Volume2 className="h-5 w-5" aria-hidden />
      )}
    </button>
  );
}
