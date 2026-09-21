"use client";

import { useState } from "react";
import { HowToPlaySheet } from "@/components/HowToPlaySheet";
import { cn } from "@/lib/utils";

/**
 * Inline trigger for the rules, for screens that want a visible button rather
 * than a settings row. The sheet itself lives in <HowToPlaySheet />, which is
 * portalled to the body, so placement here only affects the button.
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

      <HowToPlaySheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
