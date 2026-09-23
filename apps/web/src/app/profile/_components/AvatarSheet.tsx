"use client";
import { useSession, setAvatarFn } from "@word-lock/client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Avatar } from "@/components/Avatar";
import { BottomSheet } from "@/components/BottomSheet";
import { CheckIcon } from "@/components/icons/CheckIcon";
import { CrossIcon } from "@/components/icons/CrossIcon";
import { AVATAR_IDS, normalizeAvatarId } from "@word-lock/core/account";
import { cn } from "@/lib/utils";

export function AvatarSheet({
  open,
  onClose,
  current,
}: {
  open: boolean;
  onClose: () => void;
  current: string | null | undefined;
}) {
  const { sessionId } = useSession();
  const queryClient = useQueryClient();
  const stored = normalizeAvatarId(current);
  const [selected, setSelected] = useState(stored);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the draft selection on each open, which is a prop transition rather than derivable state
    setSelected(stored);

    const timer = setTimeout(() => {
      gridRef.current?.querySelector('[aria-checked="true"]')?.scrollIntoView({ block: "center" });
    }, 150);
    return () => clearTimeout(timer);
  }, [open, stored]);

  const mutation = useMutation({
    mutationFn: () => setAvatarFn({ sessionId: sessionId!, avatar: selected }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      onClose();
    },
  });

  const unchanged = selected === stored;

  return (
    <BottomSheet open={open} onClose={onClose} label="Choose your avatar">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg leading-tight">Choose your avatar</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            This is the face players see next to your name
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="soft-icon-btn btn-danger h-8 w-8 shrink-0"
        >
          <CrossIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <div
        ref={gridRef}
        className="mt-8 max-h-[46vh] overflow-y-auto overscroll-contain pt-5"
        role="radiogroup"
        aria-label="Avatars"
      >
        <div className="grid grid-cols-4 justify-items-center gap-3 pb-1">
          {AVATAR_IDS.map((id, index) => {
            const active = id === selected;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={`Avatar ${index + 1}`}
                onClick={() => setSelected(id)}
                disabled={mutation.isPending}
                className={cn(
                  "press relative grid place-items-center rounded-full p-0.5 outline-none",
                  active ? "ring-2 ring-sky" : "ring-0",
                )}
              >
                <Avatar avatar={id} className="h-16 w-16" />
                {active && (
                  <span
                    aria-hidden
                    className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full bg-sky text-background"
                  >
                    <CheckIcon className="h-5 w-5" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={unchanged || mutation.isPending || !sessionId}
        className="soft-btn btn-sky mt-7 w-full py-3 text-sm tracking-wide disabled:opacity-60"
      >
        {mutation.isPending ? "Saving…" : unchanged ? "Saved" : "Save avatar"}
      </button>

      {mutation.error && (
        <p role="alert" className="mt-2 text-center text-sm font-semibold text-destructive">
          {mutation.error.message}
        </p>
      )}
    </BottomSheet>
  );
}
