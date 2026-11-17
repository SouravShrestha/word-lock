"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { createGameFn, useSession } from "@word-lock/client";
import { TIME_CONTROLS, type TimeControl } from "@word-lock/core/game";

import { BottomSheet } from "@/components/BottomSheet";
import { CrossIcon } from "@/components/icons/CrossIcon";
import { cn } from "@/lib/utils";

const icon = (id: TimeControl): ReactNode => (
  <img src={`/christmas/modes/mode-${id}.webp`} alt="" width={28} height={28} />
);

/**
 * The one way a room gets created: every "New Game" button (home, the game-over
 * card, a match from history) opens this rather than creating directly, so the
 * host always picks the pace before anyone is invited.
 */
export function NewGameSheet({
  open,
  onClose,
  onCreated,
  zClassName,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  zClassName?: string;
}) {
  const router = useRouter();
  const { sessionId, ready } = useSession();
  const [selected, setSelected] = useState<TimeControl>("10m");

  const createMutation = useMutation({
    mutationFn: () => createGameFn({ sessionId: sessionId!, timeControl: selected }),
    onSuccess: ({ roomCode }: { roomCode: string }) => {
      onClose();
      onCreated?.();
      router.push(`/game/${roomCode}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const option = (id: TimeControl) => ({
    type: "button" as const,
    "aria-pressed": selected === id,
    onClick: () => setSelected(id),
  });
  const tone = (id: TimeControl) => (selected === id ? "btn-sky" : "btn-surface");

  return (
    <BottomSheet open={open} onClose={onClose} label="New game" zClassName={zClassName}>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="soft-icon-btn btn-danger h-8 w-8"
        >
          <CrossIcon className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-10 flex gap-3">
        {TIME_CONTROLS.map((c) => (
          <button
            key={c.id}
            {...option(c.id)}
            className={cn(
              "soft-btn flex flex-1 flex-col items-center gap-3 px-2 py-7 tv-label",
              tone(c.id),
            )}
          >
            {icon(c.id)}
            {c.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => createMutation.mutate()}
        disabled={!ready || createMutation.isPending}
        className="soft-btn btn-mint mt-10 w-full py-3.5 tv-body-base tracking-wide disabled:opacity-60"
      >
        {createMutation.isPending ? "Creating" : "Start game"}
      </button>
    </BottomSheet>
  );
}
