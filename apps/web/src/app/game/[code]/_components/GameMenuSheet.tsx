"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

import { BottomSheet } from "@/components/BottomSheet";
import { CrossIcon } from "@/components/icons/CrossIcon";
import { HowToPlaySheet } from "@/components/HowToPlaySheet";
import { ChevronRightIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { AppearanceSheet, THEME_LABELS } from "@/app/profile/_components/AppearanceSheet";

function MenuRow({
  label,
  hint,
  value,
  onClick,
  className,
}: {
  label: string;
  hint?: string;
  value?: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("press flex w-full items-center gap-3.5 px-2 py-4 text-left", className)}
    >
      <span className="min-w-0 flex-1">
        <span className="block tv-body tracking-wide">{label}</span>
        {hint ? (
          <span className="mt-0.5 block tv-caption text-muted-foreground">{hint}</span>
        ) : null}
      </span>
      {value ? (
        <span className="max-w-[60%] truncate text-sm font-normal text-muted-foreground">
          {value}
        </span>
      ) : null}
      <ChevronRightIcon aria-hidden size={16} className="shrink-0 opacity-60" strokeWidth={2.5} />
    </button>
  );
}

export function GameMenuSheet({
  open,
  onClose,
  canForfeit,
  onForfeit,
}: {
  open: boolean;
  onClose: () => void;
  canForfeit: boolean;
  onForfeit: () => void;
}) {
  const [nested, setNested] = useState<"rules" | "appearance" | null>(null);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the resolved theme is only known on the client
    setMounted(true);
  }, []);

  return (
    <>
      <BottomSheet
        open={open}
        onClose={onClose}
        label="Game menu"
        dismissable={!nested}
        showHandle={!nested}
      >
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="soft-icon-btn btn-danger h-8 w-8"
          >
            <CrossIcon className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-6 flex flex-col">
          <MenuRow
            label="Appearance"
            value={mounted ? (THEME_LABELS[theme ?? "system"] ?? "System") : "…"}
            onClick={() => setNested("appearance")}
          />
          <MenuRow label="How to play" onClick={() => setNested("rules")} />
          {canForfeit && (
            <MenuRow
              label="Quit game"
              hint="Your opponent wins and you lose medals."
              onClick={() => {
                onClose();
                onForfeit();
              }}
              className="text-destructive"
            />
          )}
        </div>
      </BottomSheet>

      <HowToPlaySheet
        open={nested === "rules"}
        onClose={() => setNested(null)}
        zClassName="z-[90]"
      />
      <AppearanceSheet
        open={nested === "appearance"}
        onClose={() => setNested(null)}
        zClassName="z-[90]"
      />
    </>
  );
}
