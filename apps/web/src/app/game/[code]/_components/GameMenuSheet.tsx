"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

import { BottomSheet } from "@/components/BottomSheet";
import { CrossIcon } from "@/components/icons/CrossIcon";
import { HowToPlaySheet } from "@/components/HowToPlaySheet";
import { Toggle } from "@/components/Toggle";
import { ChevronRightIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

function MenuRow({
  label,
  hint,
  onClick,
  className,
}: {
  label: string;
  hint?: string;
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
        <span className="block text-sm font-medium tracking-wide">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span> : null}
      </span>
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
  const [showRules, setShowRules] = useState(false);
  const { theme, setTheme } = useTheme();
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
        dismissable={!showRules}
        showHandle={!showRules}
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg">Game menu</h2>
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
          <div className="flex items-center gap-3.5 px-2 py-4">
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium tracking-wide">Dark theme</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">Easier on the eyes</span>
            </span>
            <Toggle
              label="Dark theme"
              checked={mounted && theme === "dark"}
              onChange={(next) => setTheme(next ? "dark" : "light")}
            />
          </div>

          <MenuRow label="How to play" onClick={() => setShowRules(true)} />
          {canForfeit && (
            <MenuRow
              label="Quit game"
              hint="Your opponent wins and you lose stars."
              onClick={() => {
                onClose();
                onForfeit();
              }}
              className="text-destructive"
            />
          )}
        </div>
      </BottomSheet>

      <HowToPlaySheet open={showRules} onClose={() => setShowRules(false)} zClassName="z-[90]" />
    </>
  );
}
