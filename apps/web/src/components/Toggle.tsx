"use client";

import { cn } from "@/lib/utils";

/**
 * Switch. A hidden checkbox drives a track and a thumb that are both its
 * siblings — `peer-checked:` only reaches siblings, so the thumb cannot live
 * inside the track the way the original CSS nests it.
 */
export function Toggle({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Accessible name; the switch carries no visible text of its own. */
  label: string;
  className?: string;
}) {
  return (
    <label className={cn("relative inline-block h-[22px] w-[41px] shrink-0", className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
        className="peer sr-only"
      />

      <span
        aria-hidden
        className="block h-[22px] w-[41px] rounded-[15px] bg-[#080808] transition-colors duration-[250ms] peer-checked:bg-sky peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background"
      />

      <span
        aria-hidden
        className="pointer-events-none absolute top-[2.5px] left-[2.3px] h-[17px] w-[27px] rounded-lg bg-white shadow-[0_1px_2px_rgba(0,0,0,0.35),0_6px_12px_rgba(0,0,0,0.18)] transition-transform duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] peer-checked:translate-x-[9px]"
      />
    </label>
  );
}
