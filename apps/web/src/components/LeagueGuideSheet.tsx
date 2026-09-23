"use client";

import { BottomSheet } from "@/components/BottomSheet";
import { CrossIcon } from "@/components/icons/CrossIcon";
import { LeagueIcon, LEAGUE_TEXT_CLASS } from "@/components/icons/LeagueIcon";
import { LEAGUES } from "@word-lock/core/account";
import { cn } from "@/lib/utils";

export function LeagueGuideSheet({
  open,
  onClose,
  zClassName,
}: {
  open: boolean;
  onClose: () => void;
  zClassName?: string;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} label="League tiers" zClassName={zClassName}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold">League tiers</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="soft-icon-btn btn-danger h-8 w-8"
        >
          <CrossIcon className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Climb the ladder by winning games and earning stars.
      </p>

      <ul className="mt-6 flex flex-col gap-2">
        {LEAGUES.map((tier) => (
          <li key={tier.id} className="flex items-center gap-4 rounded-md px-2 py-3">
            <LeagueIcon league={tier.id} className="h-12 w-12 shrink-0" />
            <div className="flex flex-col">
              <span
                className={cn(
                  "font-display text-base font-semibold tracking-wide",
                  LEAGUE_TEXT_CLASS[tier.id],
                )}
              >
                {tier.name}
              </span>
              <span className="text-xs font-semibold text-muted-foreground tracking-wide">
                {tier.maxStars === null
                  ? `${tier.minStars}+ stars`
                  : `${tier.minStars} - ${tier.maxStars} stars`}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </BottomSheet>
  );
}
