"use client";

import { BottomSheet } from "@/components/BottomSheet";
import { CrossIcon } from "@/components/icons/CrossIcon";
import { RULES } from "@/lib/game/rules";

/**
 * The rules, as a controlled sheet.
 *
 * Split out from <HowToPlay /> so the rules can be reached from more than one
 * place: the home screen owns a button, Settings owns a row, and both open this.
 * Keeping the trigger out of here is what makes that possible.
 *
 * The rule text comes from `lib/game/rules.ts`, shared with the public
 * `/how-to-play` page — this sheet is the short version of that page, not a
 * second account of the game.
 */
export function HowToPlaySheet({
  open,
  onClose,
  zClassName,
}: {
  open: boolean;
  onClose: () => void;
  /** Pass a higher level when opening this from inside another sheet. */
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
            {/* Same extruded fill as the app's buttons, minus the press
                behaviour — it is a label, not a control. */}
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
