"use client";

import { useState } from "react";

import { StreakIcon } from "@/components/icons/StreakIcon";
import { LeagueIcon, LEAGUE_TEXT_CLASS } from "@/components/icons/LeagueIcon";
import { StreakSheet } from "@/components/StreakSheet";
import { useAccount } from "@/hooks/use-account";
import { leagueById } from "@/lib/account/leagues";
import { cn } from "@/lib/utils";

/**
 * Both pills read the account summary themselves rather than taking a value.
 * Streak and stars are stored on the player row, so there is nothing for a
 * parent to derive and pass down — and the two screens showing these pills would
 * otherwise each have to fetch the same thing.
 */

/**
 * Consecutive days the player has taken a turn. Tapping it opens the weekly
 * breakdown, so the pill is a real button rather than a pressable span.
 */
export function StreakPill() {
  const { data } = useAccount();
  const [open, setOpen] = useState(false);

  const value = data?.playStreak ?? 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={value === 1 ? "1 day streak" : `${value} day streak`}
        className="stat-pill press text-sm text-[#FC9502]"
      >
        <StreakIcon className="h-6 w-6" />
        <span className="-ml-1 pt-1 text-base">{value}</span>
      </button>

      <StreakSheet
        open={open}
        onClose={() => setOpen(false)}
        playStreak={value}
        lastPlayedOn={data?.lastPlayedOn ?? null}
      />
    </>
  );
}

/**
 * Star count, badged with the player's league.
 *
 * The badge carries the star glyph's job here — it already reads as "this is the
 * ladder number", and it says which band the number sits in, which the star
 * alone never did. Showing both left three marks explaining two things.
 */
export function StarsPill() {
  const { data } = useAccount();

  const value = data?.stars ?? 0;
  const league = data?.league ?? "bronze";

  return (
    <span
      className={cn("stat-pill text-sm", LEAGUE_TEXT_CLASS[league])}
      title={`${value} stars · ${leagueById(league).name}`}
    >
      <LeagueIcon league={league} className="h-8 w-9" />
      <span className="text-base">{value}</span>
    </span>
  );
}
