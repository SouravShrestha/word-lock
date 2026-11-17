"use client";
import { useAccount } from "@word-lock/client";

import { StarIcon } from "@/components/icons/StarIcon";
import { StreakIcon } from "@/components/icons/StreakIcon";
import { browserTimezone } from "@word-lock/core/account";
import { currentStreak, localDate } from "@word-lock/core/game";
import { cn } from "@/lib/utils";

/**
 * Where the player stands right now: streak and medals.
 *
 * Four facts, each with its own glyph, rather than a column of labelled numbers —
 * these are the things a player checks at a glance, and the icons are already how
 * they are marked everywhere else in the app.
 *
 * Every figure is server-authoritative, read off the player row.
 */
export function OverviewCard() {
  const { data: account } = useAccount();
  const stars = account?.stars ?? 0;
  const streak = currentStreak(
    {
      play_streak: account?.playStreak ?? 0,
      last_played_on: account?.lastPlayedOn ?? null,
      last_freeze_on: account?.lastFreezeOn ?? null,
    },
    localDate(new Date(), browserTimezone()),
  );

  return (
    <section className="pt-4 px-4 pb-2">
      <div className="grid grid-cols-2 gap-x-3 gap-y-5">
        <Fact
          icon={<StreakIcon className="h-6 w-6" />}
          tint="text-streak"
          label={streak === 1 ? "1 day" : `${streak} days`}
        />
        <Fact
          icon={<StarIcon className="h-6 w-6" />}
          tint="text-mint"
          label={`${stars} ${stars === 1 ? "medal" : "medals"}`}
        />
      </div>
    </section>
  );
}

function Fact({ icon, tint, label }: { icon: React.ReactNode; tint: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={cn("grid w-8 shrink-0 place-items-center", tint)}>{icon}</span>
      <span className="min-w-0 truncate tv-label">{label}</span>
    </div>
  );
}
