"use client";

import { useState } from "react";
import { CrossIcon } from "@/components/icons/CrossIcon";

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
    body: "A tile of yours surrounded on all sides by your own tiles is locked - your opponent can no longer steal it.",
  },
  {
    title: "Win the board",
    body: "The game ends when every tile is claimed. Whoever owns the most tiles wins. Turns expire after 24 hours.",
  },
];

export function HowToPlay() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="chunky-btn absolute bottom-5 right-5 z-40 bg-primary px-4 py-2.5 text-sm text-primary-foreground"
      >
        How to play?
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 p-4 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-label="How to play"
            onClick={(e) => e.stopPropagation()}
            className="neo w-full max-w-md p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg">How to play</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex items-center transition-transform hover:-translate-x-px hover:-translate-y-px active:translate-x-0.5 active:translate-y-0.5"
              >
                <CrossIcon className="h-5 w-5 ml-0.5" />
              </button>
            </div>
            <ol className="mt-8 flex flex-col gap-4">
              {RULES.map((rule, i) => (
                <li key={rule.title} className="flex gap-3">
                  <span className="letter-tile mt-0.5 h-7 w-7 shrink-0 text-xs">{i + 1}</span>
                  <div>
                    <p className="text-sm font-bold">{rule.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {rule.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
