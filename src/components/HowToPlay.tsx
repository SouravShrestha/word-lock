"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/BottomSheet";
import { CrossIcon } from "@/components/icons/CrossIcon";
import { cn } from "@/lib/utils";

const RULES: { title: string; body: string }[] = [
  {
    title: "Take turns",
    body: "Two players share one 5×5 letter grid. On your turn, tap letters to spell a word of 3 letters or more.",
  },
  {
    title: "Claim tiles",
    body: "Every tile you use in a valid word becomes yours. Tiles your opponent owned flip to your colour.",
  },
  {
    title: "Lock tiles",
    body: "A tile of yours surrounded on all sides (non-diagonal) by your own tiles is locked - your opponent can no longer steal it.",
  },
  {
    title: "Win the board",
    body: "The game ends when every tile is claimed. Whoever owns the most tiles wins. Turns expire after 24 hours.",
  },
];

/**
 * Trigger + bottom sheet for the rules. The trigger renders inline so the
 * calling screen controls placement; the sheet itself is portalled to the body
 * by <BottomSheet />.
 */
export function HowToPlay({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("soft-btn btn-sun px-4 py-2 text-xs", className)}
      >
        How to play?
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} label="How to play">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg">How to play</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
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
    </>
  );
}
