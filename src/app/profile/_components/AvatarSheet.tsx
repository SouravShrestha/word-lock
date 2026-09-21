"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Avatar } from "@/components/Avatar";
import { BottomSheet } from "@/components/BottomSheet";
import { CheckIcon } from "@/components/icons/CheckIcon";
import { CrossIcon } from "@/components/icons/CrossIcon";
import { useSession } from "@/hooks/use-session";
import { setAvatarFn } from "@/lib/game/api.client";
import { AVATAR_IDS, normalizeAvatarId } from "@/lib/account/avatars";
import { cn } from "@/lib/utils";

/**
 * Avatar picker.
 *
 * Dismissable, unlike the username and login sheets: a player always has an
 * avatar, so there is nothing to force. Closing leaves the stored one in place.
 *
 * Choosing does not save. The grid holds a local selection and the button
 * commits it, so a stray tap while browsing fifty faces does not write to the
 * account — and the one write that does happen is the one the player asked for.
 */
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

  /*
   * Re-opening starts from what is actually saved, not from whatever was last
   * tapped before the sheet was dismissed, and scrolls that avatar into view —
   * with fifty of them the stored one is usually several rows down, and a picker
   * that opens showing no selection reads as though nothing is set.
   */
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the draft selection on each open, which is a prop transition rather than derivable state
    setSelected(stored);

    /*
     * Deferred rather than run on the next frame: the sheet mounts its panel in
     * its own effect, so on the frame after `open` flips there is nothing in the
     * DOM to scroll to. This lands mid slide-in, where the jump is invisible.
     */
    const timer = setTimeout(() => {
      gridRef.current?.querySelector('[aria-checked="true"]')?.scrollIntoView({ block: "center" });
    }, 150);
    return () => clearTimeout(timer);
  }, [open, stored]);

  const mutation = useMutation({
    mutationFn: () => setAvatarFn({ sessionId: sessionId!, avatar: selected }),
    onSuccess: () => {
      // The avatar rides along with the account summary, and with every game and
      // match-history payload that names this player.
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

      {/*
        The grid scrolls, not the sheet. With fifty-odd avatars the sheet's own
        overflow would carry the Save button off the bottom of a thirteen-row
        grid, leaving the player scrolling back up to commit a choice they have
        already made. Bounding the grid keeps the heading and the button in view.
      */}
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
                  // A ring rather than a tick overlay on the art itself, so the
                  // picture stays legible while selected.
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
