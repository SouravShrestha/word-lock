"use client";
import { useAccount, useSession, fetchProfileFn } from "@word-lock/client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useRouter } from "next/navigation";

import { BackButton } from "@/components/BackButton";
import { StarIcon } from "@/components/icons/StarIcon";
import type { PlayerStats, RecentGameEntry } from "@word-lock/core/game";
import { GameDetailPopup } from "@/app/profile/_components/GameDetailPopup";
import { HistorySkeleton } from "./HistorySkeleton";
import { MatchRow } from "./MatchRow";

/**
 * Match history: a headline that says where you stand, then every finished game
 * newest first.
 *
 * The header carries the two numbers a player checks before scrolling — medals
 * and wins — so the list underneath can stay one line per game instead of
 * repeating the running totals in every row.
 */
export function HistoryClient() {
  const { sessionId, ready } = useSession();
  const [selected, setSelected] = useState<RecentGameEntry | null>(null);
  const [leaving, setLeaving] = useState(false);
  const router = useRouter();
  const goBack = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) router.push("/");
    else setLeaving(true);
  };

  const { data, isLoading } = useQuery<PlayerStats>({
    queryKey: ["profile", sessionId],
    enabled: ready,
    queryFn: () => fetchProfileFn({ sessionId: sessionId! }),
  });

  const games = data?.recentGames ?? [];

  return (
    <main
      className={`relative mx-auto flex h-dvh w-full max-w-2xl flex-col overflow-hidden${leaving ? " slide-to-right" : ""}`}
      onAnimationEnd={(e) => {
        if (leaving && e.target === e.currentTarget) router.push("/");
      }}
    >
      <div className="flex flex-1 flex-col overflow-y-auto px-5 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <div className="pt-5">
          <BackButton onClick={goBack} />
        </div>
        {!ready || isLoading ? (
          <HistorySkeleton />
        ) : (
          <>
            <Headline wins={data?.overview.wins ?? 0} />

            <div className="mt-7 h-px bg-hairline opacity-60" />

            {games.length === 0 ? (
              <div className="mt-6 p-6 text-center">
                <p className="font-display tv-heading">Nothing here yet</p>
                <p className="mt-1 tv-body text-muted-foreground">
                  Finish a game to see it listed.
                </p>
              </div>
            ) : (
              /* Full-bleed rows: the negative margin cancels the page gutter so a
                 row's press area runs edge to edge. */
              <ul className="-mx-5 mt-3 flex flex-col gap-3 pt-1 pb-8">
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

      {selected && sessionId && (
        <GameDetailPopup entry={selected} sessionId={sessionId} onClose={() => setSelected(null)} />
      )}
    </main>
  );
}

/**
 * Title plus the player's medal count.
 */
function Headline({ wins }: { wins: number }) {
  const { data: account } = useAccount();

  return (
    <header className="pt-8">
      <h1 className="font-display tv-screen-title">Your matches</h1>

      <div className="mt-2 flex items-center gap-4 tv-label text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 text-mint">
          <StarIcon className="h-6 w-6" />
          <span className="tabular-nums">{account?.stars ?? 0}</span>
        </span>
      </div>
    </header>
  );
}
