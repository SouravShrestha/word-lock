"use client";
import { useAccount, useLeaderboard } from "@word-lock/client";

import { LeagueIcon, LEAGUE_TEXT_CLASS } from "@/components/icons/LeagueIcon";
import { StarIcon } from "@/components/icons/StarIcon";
import { StreakIcon } from "@/components/icons/StreakIcon";
import { RankIcon } from "@/components/icons/RankIcon";
import { leagueById, progressToNext } from "@word-lock/core/account";
import { cn } from "@/lib/utils";

/**
 * Where the player stands right now: streak, stars, league, rank.
 *
 * Four facts, each with its own glyph, rather than a column of labelled numbers —
 * these are the things a player checks at a glance, and the icons are already how
 * they are marked everywhere else in the app.
 *
 * Every figure is server-authoritative. Stars and streak come off the player row,
 * the rank is counted against the leaderboard, and the league is the one derived
 * value, read from the star count the same way the server reads it. Everyone
 * reaching this screen has an account, so there is no locked state to show.
 */
export function OverviewCard() {
  const { data: account } = useAccount();
  const { data: leaderboard } = useLeaderboard();

  const me = leaderboard?.me ?? null;
  const stars = account?.stars ?? 0;
  const league = account?.league ?? "bronze";
  const streak = account?.playStreak ?? 0;
  const progress = progressToNext(stars);

  return (
    <section className="pt-4 px-4 pb-2">
      <div className="grid grid-cols-2 gap-x-3 gap-y-5">
        <Fact
          icon={<StreakIcon className="h-6 w-6" />}
          tint="text-[#FC9502]"
          label={streak === 1 ? "1 day" : `${streak} days`}
        />
        <Fact icon={<StarIcon className="h-6 w-6" />} tint="text-mint" label={`${stars} stars`} />
        <Fact
          icon={<LeagueIcon league={league} className="h-7 w-8" />}
          tint={LEAGUE_TEXT_CLASS[league]}
          label={leagueById(league).name}
        />
        {/* An em dash until the account has a username, since it is not listed. */}
        <Fact
          icon={<RankIcon className="h-5 w-5" />}
          tint="text-muted-foreground"
          label={me ? `#${me.leagueRank} in league` : "Unranked"}
        />
      </div>
    </section>
  );
}

function Fact({ icon, tint, label }: { icon: React.ReactNode; tint: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={cn("grid w-8 shrink-0 place-items-center", tint)}>{icon}</span>
      <span className="min-w-0 truncate text-sm font-semibold">{label}</span>
    </div>
  );
}
