"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { BottomNav, BOTTOM_NAV_SPACER, NAV_SHELL } from "@/components/BottomNav";
import { SectionLabel } from "@/components/SectionLabel";
import { LeagueIcon, LEAGUE_TEXT_CLASS } from "@/components/icons/LeagueIcon";
import { useAccount } from "@/hooks/use-account";
import { useSession } from "@/hooks/use-session";
import { fetchProfileFn } from "@/lib/game/api.client";
import type { PlayerStats, RecentGameEntry } from "@/lib/game/stats";
import { cn } from "@/lib/utils";
import { GameDetailPopup } from "@/app/profile/_components/GameDetailPopup";
import { HistorySkeleton } from "./HistorySkeleton";
import { MatchRow } from "./MatchRow";

/**
 * Match history: a headline that says where you stand, then every finished game
 * newest first.
 *
 * The header carries the two numbers a player checks before scrolling — stars
 * and wins — so the list underneath can stay one line per game instead of
 * repeating the running totals in every row.
 */
export function HistoryClient() {
  const { sessionId, ready } = useSession();
  const [selected, setSelected] = useState<RecentGameEntry | null>(null);

  const { data, isLoading } = useQuery<PlayerStats>({
    queryKey: ["profile", sessionId],
    enabled: ready,
    queryFn: () => fetchProfileFn({ sessionId: sessionId! }),
  });

  const games = data?.recentGames ?? [];

  return (
    <main className={NAV_SHELL}>
      <div className={`flex flex-1 flex-col overflow-y-auto px-5 ${BOTTOM_NAV_SPACER}`}>
        {!ready || isLoading ? (
          <HistorySkeleton />
        ) : (
          <>
            <Headline wins={data?.overview.wins ?? 0} />

            <SectionLabel className="mt-7">Match history</SectionLabel>

            {games.length === 0 ? (
              <div className="surface mt-6 p-6 text-center">
                <p className="font-display text-lg font-bold">Nothing here yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Finish a game to see it listed.
                </p>
              </div>
            ) : (
              /* Full-bleed rows: the negative margin cancels the page gutter so a
                 row's press area runs edge to edge, as it does on the leaderboard. */
              <ul className="-mx-5 mt-3 flex flex-col pt-1 pb-8">
                {games.map((entry) => (
                  <li key={entry.gameId}>
                    <MatchRow entry={entry} onSelect={setSelected} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <BottomNav />

      {selected && sessionId && (
        <GameDetailPopup entry={selected} sessionId={sessionId} onClose={() => setSelected(null)} />
      )}
    </main>
  );
}

/**
 * Title plus the two standing numbers. The league badge stands in for the star
 * glyph, the way {@link StarsPill} does — it reads as "this is the ladder
 * number" and says which band the number sits in.
 */
function Headline({ wins }: { wins: number }) {
  const { data: account } = useAccount();
  const league = account?.league ?? "bronze";

  return (
    <header className="pt-8">
      <h1 className="font-display text-3xl font-bold">Your matches</h1>

      <div className="mt-2 flex items-center gap-4 text-sm font-semibold text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <LeagueIcon league={league} className="h-6 w-7" />
          <span className={cn("tabular-nums", LEAGUE_TEXT_CLASS[league])}>
            {account?.stars ?? 0}
          </span>
        </span>
      </div>
    </header>
  );
}
