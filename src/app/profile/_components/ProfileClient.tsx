"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { ThemeToggle } from "@/components/ThemeToggle";
import { BottomNav, BOTTOM_NAV_SPACER, NAV_SHELL } from "@/components/BottomNav";
import { StreakPill, StarsPill } from "@/components/StatPills";
import { useSession } from "@/hooks/use-session";
import { useAccount } from "@/hooks/use-account";
import { fetchProfileFn } from "@/lib/game/api.client";

import type { PlayerStats, RecentGameEntry } from "@/lib/game/stats";
import { AccountCard } from "./AccountCard";
import { ProfileIdentity } from "./ProfileIdentity";
import { OverviewCard } from "./OverviewCard";
import { StarsCard } from "./StarsCard";
import { RecentGamesCard } from "./RecentGamesCard";
import { GameDetailPopup } from "./GameDetailPopup";

export function ProfileClient() {
  const { sessionId, ready } = useSession();
  const { data: account } = useAccount();
  const [selectedEntry, setSelectedEntry] = useState<RecentGameEntry | null>(null);

  const { data, isLoading } = useQuery<PlayerStats>({
    queryKey: ["profile", sessionId],
    enabled: ready,
    queryFn: () => fetchProfileFn({ sessionId: sessionId! }),
  });

  const overview = data?.overview;
  const winRate =
    overview && overview.total > 0 ? Math.round((overview.wins / overview.total) * 100) : null;

  return (
    <main className={NAV_SHELL}>
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <div className="flex items-center gap-4">
          <StreakPill />
          <StarsPill />
        </div>
        <ThemeToggle />
      </div>

      <div className={`flex flex-1 flex-col overflow-y-auto px-5 ${BOTTOM_NAV_SPACER}`}>
        <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
          <ProfileIdentity username={account?.username} avatar={account?.avatar} />

          <AccountCard />

          <StarsCard />

          {!ready || isLoading ? (
            <p className="mt-4 text-center text-sm text-muted-foreground">Loading…</p>
          ) : overview && overview.total > 0 ? (
            <>
              <OverviewCard overview={overview} winRate={winRate} />
              <RecentGamesCard recentGames={data!.recentGames} onSelect={setSelectedEntry} />
            </>
          ) : (
            <div className="surface p-6 text-center">
              <p className="font-display text-lg font-bold">No games finished yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Go play one!</p>
            </div>
          )}
        </div>
      </div>

      <BottomNav />

      {selectedEntry && (
        <GameDetailPopup
          entry={selectedEntry}
          sessionId={sessionId!}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </main>
  );
}
