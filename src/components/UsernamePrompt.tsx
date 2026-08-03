"use client";

import { useEffect, useRef, useState } from "react";
import { AvatarPandaIcon } from "@/components/icons/AvatarPandaIcon";
import { useSession } from "@/hooks/use-session";

export function UsernamePrompt() {
  const { ready, isNameSet, displayName, setDisplayName } = useSession();
  // Derive visibility directly — no extra effect cycle needed
  const shouldShow = ready && !isNameSet;
  const [draft, setDraft] = useState(displayName);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync draft once the auto-generated name arrives (first-time users)
  useEffect(() => {
    if (shouldShow && !draft) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft(displayName);
    }
  }, [shouldShow, displayName]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (shouldShow) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [shouldShow]);

  if (!shouldShow) return null;

  const commit = () => {
    setDisplayName(draft.trim() || displayName);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/70 backdrop-blur-sm px-6">
      <div className="neo bg-card w-full max-w-xs p-6 flex flex-col gap-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary border-2 border-foreground">
            <AvatarPandaIcon className="w-6 h-6 text-foreground" />
          </div>
          <h2 className="text-lg font-bold">What&apos;s your name?</h2>
          <p className="text-sm text-muted-foreground">This is how your opponent will see you.</p>
        </div>

        <div className="flex flex-col gap-3">
          <input
            ref={inputRef}
            value={draft}
            maxLength={7}
            placeholder="Enter your name…"
            onChange={(e) => setDraft(e.target.value.replace(/\s+/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
            }}
            className="w-full rounded-md border-[2px] border-foreground bg-background px-4 py-2.5 text-base font-bold text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground"
          />

          <button
            type="button"
            onClick={commit}
            className="chunky-btn w-full bg-primary py-2.5 text-sm text-primary-foreground"
          >
            Let&apos;s go
          </button>
        </div>
      </div>
    </div>
  );
}
