"use client";

import { useState } from "react";

import { StreakIcon } from "@/components/icons/StreakIcon";
import { LeagueIcon, LEAGUE_TEXT_CLASS } from "@/components/icons/LeagueIcon";
import { StreakSheet } from "@/components/StreakSheet";
import { useAccount } from "@word-lock/client";
import { leagueById } from "@word-lock/core/account";
import { cn } from "@/lib/utils";

export function StreakPill() {
  const { data } = useAccount();
  const [open, setOpen] = useState(false);

  const value = data?.playStreak ?? 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="stat-pill press tv-body text-streak"
      >
        <StreakIcon className="h-6 w-6" />
        <span className="-ml-1 pt-1 tv-body-base">{value}</span>
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

export function StarsPill() {
  const { data } = useAccount();

  const value = data?.stars ?? 0;
  const league = data?.league ?? "bronze";

  return (
    <span
      className={cn("stat-pill tv-body", LEAGUE_TEXT_CLASS[league])}
      title={`${value} stars · ${leagueById(league).name}`}
    >
      <LeagueIcon league={league} className="h-8 w-9" />
      <span className="tv-body-base -ml-1">{value}</span>
    </span>
  );
}
