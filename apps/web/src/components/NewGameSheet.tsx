"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { createGameFn, useSession } from "@word-lock/client";
import { TIME_CONTROLS, type TimeControl } from "@word-lock/core/game";

import { BottomSheet } from "@/components/BottomSheet";
import { CrossIcon } from "@/components/icons/CrossIcon";
import { BulletIcon, ClockIcon, LightningIcon, SunFullIcon } from "@word-lock/icons";
import { cn } from "@/lib/utils";

// Placeholder artwork until the modes get icons of their own.
const ICONS: Record<TimeControl, ReactNode> = {
  "10m": <BulletIcon size={24} />,
  "30m": <LightningIcon size={24} />,
  "60m": <ClockIcon size={24} />,
  daily: <SunFullIcon size={20} />,
};

const BANK = TIME_CONTROLS.filter((c) => c.group === "bank");
const DAILY = TIME_CONTROLS.filter((c) => c.group === "daily");

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
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg">Start a game</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="soft-icon-btn btn-danger h-8 w-8"
        >
          <CrossIcon className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-8 flex gap-3">
        {BANK.map((c) => (
          <button
            key={c.id}
            {...option(c.id)}
            className={cn(
              "soft-btn flex flex-1 flex-col items-center gap-2 px-2 py-4 tv-label",
              tone(c.id),
            )}
          >
            {ICONS[c.id]}
            {c.label}
          </button>
        ))}
      </div>

      {DAILY.map((c) => (
        <button
          key={c.id}
          {...option(c.id)}
          className={cn(
            "soft-btn mt-3 flex w-full items-center justify-center gap-3 px-4 py-4 tv-label",
            tone(c.id),
          )}
        >
          {ICONS[c.id]}
          {c.label}
        </button>
      ))}

      <button
        type="button"
        onClick={() => createMutation.mutate()}
        disabled={!ready || createMutation.isPending}
        className="soft-btn btn-mint mt-8 w-full py-3.5 tv-body-base tracking-wide disabled:opacity-60"
      >
        {createMutation.isPending ? "Creating" : "Create room"}
      </button>
    </BottomSheet>
  );
}
