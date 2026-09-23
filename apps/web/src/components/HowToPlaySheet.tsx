"use client";

import { BottomSheet } from "@/components/BottomSheet";
import { CrossIcon } from "@/components/icons/CrossIcon";
import { RULES } from "@word-lock/core/game";

export function HowToPlaySheet({
  open,
  onClose,
  zClassName,
}: {
  open: boolean;
  onClose: () => void;
  zClassName?: string;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} label="How to play" zClassName={zClassName}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg">How to play</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="soft-icon-btn btn-danger h-8 w-8"
        >
          <CrossIcon className="h-3.5 w-3.5" />
        </button>
      </div>
      <ol className="mt-10 flex flex-col gap-4">
        {RULES.map((rule, i) => (
          <li key={rule.title} className="flex gap-3">
            <span className="soft-btn btn-sun mt-0.5 h-7 w-7 shrink-0 text-xs">{i + 1}</span>
            <div>
              <p className="text-sm font-bold">{rule.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{rule.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </BottomSheet>
  );
}
