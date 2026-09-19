"use client";

import { LeagueIcon, LEAGUE_TEXT_CLASS } from "@/components/icons/LeagueIcon";
import { useAccount } from "@/hooks/use-account";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import { leagueById, progressToNext } from "@/lib/account/leagues";
import { cn } from "@/lib/utils";

/**
 * Stars, league and streak. Everyone reaching this screen has an account, so
 * there is no locked state to show.
 *
 * Every number is server-authoritative: stars and peak come from the player row,
 * the ranks are counted against the leaderboard, and the streak is the daily play
 * streak. The league is the one derived value, read from the star count the same
 * way the server reads it.
 */
export function StarsCard() {
  const { data: account } = useAccount();
  const { data: leaderboard } = useLeaderboard();

  const me = leaderboard?.me ?? null;
  const stars = account?.stars ?? 0;
  const league = account?.league ?? "bronze";
  const progress = progressToNext(stars);

  return (
    <section className="surface p-4">
      <h2 className="eyebrow mb-3 text-xs text-muted-foreground">League</h2>

      <div className="flex items-center gap-3">
        <LeagueIcon league={league} className="h-12 w-12 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className={cn("font-display text-lg font-bold", LEAGUE_TEXT_CLASS[league])}>
            {leagueById(league).name}
          </p>
          <p className="text-xs text-muted-foreground">
            {me && <>#{me.leagueRank} in league · </>}
            {progress.next
              ? `${progress.starsToNext} stars to ${progress.next.name}`
              : "Top of the ladder"}
          </p>
        </div>
      </div>

      {/*
        No bar in Diamond: there is no band above to measure against, and a full
        bar there would read as "one more win to promote".
      */}
      {progress.next && (
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={progress.league.minStars}
          aria-valuemax={progress.next.minStars}
          aria-valuenow={stars}
          aria-label={`Progress to ${progress.next.name}`}
        >
          <div
            className="h-full rounded-full bg-sky transition-[width]"
            style={{ width: `${Math.round(progress.fraction * 100)}%` }}
          />
        </div>
      )}

      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        <Stat label="Stars" value={stars} accent={LEAGUE_TEXT_CLASS[league]} />
        <Stat label="Peak" value={account?.peakStars ?? 0} accent="text-foreground" />
        {/* An em dash until the account has a username, since it is not listed. */}
        <Stat label="Rank" value={me ? `#${me.leagueRank}` : "—"} accent="text-foreground" />
        <Stat label="Streak" value={account?.playStreak ?? 0} accent="text-[#FC9502]" />
      </div>
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: number | string; accent: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`font-display text-2xl font-bold ${accent}`}>{value}</span>
      <span className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">{label}</span>
    </div>
  );
}
