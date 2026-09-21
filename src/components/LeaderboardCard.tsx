"use client";

import { useEffect, useRef } from "react";
import { LeagueIcon, LEAGUE_TEXT_CLASS } from "@/components/icons/LeagueIcon";
import { QuestionMarkIcon } from "@/components/icons/QuestionMarkIcon";
import { StarIcon } from "@/components/icons/StarIcon";
import { LeaderboardSkeleton } from "@/components/LeaderboardSkeleton";
import { useAccount } from "@/hooks/use-account";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import { LEAGUES, leagueById, type LeagueId } from "@/lib/account/leagues";
import { cn } from "@/lib/utils";

/**
 * The leaderboard: top {@link LEADERBOARD_SIZE} of the viewer's own league band.
 *
 * There is no global scope and no tabs — a hundred names from across the whole
 * ladder said little, whereas your own band is the set you are actually
 * competing with for promotion. Which band that is comes from the server, not
 * from here — the client never asks to be ranked somewhere it is not.
 */
export function LeaderboardCard({ onOpenGuide }: { onOpenGuide: () => void }) {
  const { data: account } = useAccount();
  const { data, isLoading } = useLeaderboard();

  const league = data?.league ?? "bronze";
  const entries = data?.entries ?? [];
  const me = data?.me ?? null;

  const myRank = me?.leagueRank ?? null;
  const inList = myRank !== null && entries.some((e) => e.rank === myRank);

  // First entry that falls in the demotion zone: the bottom of the band, sized
  // the same as the promotion cut at the top so the two read as symmetrical.
  const demotionStart = Math.max(entries.length - PROMOTION_SIZE, PROMOTION_SIZE);

  return (
    <div className="flex flex-col">
      <LeagueHeader league={league} onOpenGuide={onOpenGuide} />

      <div className="flex flex-col gap-4 px-5 pt-5">
        {isLoading ? (
          <LeaderboardSkeleton />
        ) : entries.length === 0 ? (
          <EmptyState league={league} />
        ) : (
          <>
            <ul className="flex flex-col gap-2.5">
              {entries.map((entry, index) => (
                <li key={entry.playerId} className="flex flex-col gap-2.5">
                  {index === PROMOTION_SIZE && entries.length > PROMOTION_SIZE && (
                    <ZoneDivider kind="promotion" />
                  )}
                  {index === demotionStart && index !== PROMOTION_SIZE && (
                    <ZoneDivider kind="demotion" />
                  )}
                  <Row
                    rank={entry.rank}
                    name={entry.username}
                    stars={entry.stars}
                    league={entry.league}
                    isViewer={entry.playerId === account?.playerId}
                  />
                </li>
              ))}
            </ul>

            {/*
              Shown only when the viewer is on the board but sits outside the
              visible rows, so they can still see where they stand.
            */}
            {me && myRank !== null && !inList && account?.username && (
              <>
                <p className="text-center text-xs font-semibold text-muted-foreground">···</p>
                <ul>
                  <Row
                    rank={myRank}
                    name={account.username}
                    stars={me.stars}
                    league={me.league}
                    isViewer
                  />
                </ul>
              </>
            )}

            {!me && (
              <p className="px-1 text-center text-xs font-semibold text-muted-foreground">
                Pick a username to join the board.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** Rows above this line promote, rows within this many of the bottom demote. */
const PROMOTION_SIZE = 3;

function LeagueHeader({ league, onOpenGuide }: { league: LeagueId; onOpenGuide: () => void }) {
  const band = leagueById(league);
  const index = LEAGUES.findIndex((tier) => tier.id === league);
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [league]);

  return (
    <div className="px-5 pb-6 pt-8 border-b-2 border-border">
      <div className="flex items-center justify-between gap-4">
        <p className={cn("font-display text-3xl font-bold", LEAGUE_TEXT_CLASS[league])}>
          {band.name} League
        </p>
        <button
          type="button"
          onClick={onOpenGuide}
          aria-label="League tiers"
          className="soft-icon-btn btn-surface h-9 w-9 shrink-0"
        >
          <QuestionMarkIcon className="h-[1.1rem] w-[1.1rem]" />
        </button>
      </div>
      <p className="mt-1 text-sm font-semibold text-muted-foreground">
        {band.maxStars === null
          ? `${band.minStars}+ stars`
          : `${band.minStars} - ${band.maxStars} stars`}
      </p>

      <div className="mt-5 flex items-center gap-4 overflow-x-auto -mx-5 px-5">
        {LEAGUES.map((tier, i) => (
          <div key={tier.id} ref={i === index ? activeRef : undefined} className="shrink-0">
            <LeagueIcon
              league={tier.id}
              className={cn(
                "h-24 w-24",
                i != index && "opacity-80 h-16 w-16",
                i > index && "grayscale opacity-30",
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ZoneDivider({ kind }: { kind: "promotion" | "demotion" }) {
  const isPromotion = kind === "promotion";
  return (
    <div className="flex items-center justify-center gap-1.5 py-1">
      <span className={cn("text-xs", isPromotion ? "text-mint" : "text-destructive")} aria-hidden>
        {isPromotion ? "▲" : "▼"}
      </span>
      <p className={cn("eyebrow text-[0.7rem]", isPromotion ? "text-mint" : "text-destructive")}>
        {isPromotion ? "Promotion zone" : "Demotion zone"}
      </p>
    </div>
  );
}

function EmptyState({ league }: { league: LeagueId }) {
  return <></>;
}

function Row({
  rank,
  name,
  stars,
  league,
  isViewer = false,
}: {
  rank: number;
  name: string;
  stars: number;
  league: LeagueId;
  isViewer?: boolean;
}) {
  return (
    <div
      className={cn("flex items-center gap-3.5 pl-5 pr-6 py-6 -mx-5", isViewer && "bg-muted/50")}
    >
      <span className="font-display w-5 shrink-0 text-center text-sm font-semibold tabular-nums text-accent">
        {rank}
      </span>

      <span className="min-w-0 flex-1 truncate text-sm font-semibold">
        {name}
        {isViewer && (
          <span className="ml-1.5 text-xs text-muted-foreground font-normal">(you)</span>
        )}
      </span>

      <span className={cn("stat-pill shrink-0 text-sm", LEAGUE_TEXT_CLASS[league])}>
        <StarIcon className="h-5 w-5" />
        {stars}
      </span>
    </div>
  );
}
