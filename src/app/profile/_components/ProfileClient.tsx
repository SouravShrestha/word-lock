"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { useSession } from "@/hooks/use-session";
import { fetchProfileFn } from "@/lib/game/api.client";
import type { PlayerStats, RecentGameEntry } from "@/lib/game/stats";
import { NameEditor } from "./NameEditor";
import { OverviewCard } from "./OverviewCard";
import { RecentGamesCard } from "./RecentGamesCard";
import { GameDetailPopup } from "./GameDetailPopup";

export function ProfileClient() {
  const { sessionId, displayName, setDisplayName, ready } = useSession();
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
    <main className="dot-paper mx-auto h-[100dvh] overflow-y-auto max-w-2xl px-5 py-6 flex flex-col relative">
      <Header />

      <div className="w-full max-w-sm mx-auto flex flex-col gap-6 pb-10">
        <NameEditor value={displayName} onChange={setDisplayName} />

        {!ready || isLoading ? (
          <p className="text-center text-sm text-muted-foreground mt-4">Loading…</p>
        ) : overview && overview.total > 0 ? (
          <>
            <OverviewCard overview={overview} winRate={winRate} />
            <RecentGamesCard recentGames={data!.recentGames} onSelect={setSelectedEntry} />
          </>
        ) : (
          <div className="neo p-6 text-center">
            <p className="font-display font-bold text-lg">No games finished yet</p>
            <p className="text-sm text-muted-foreground mt-1">Go play one!</p>
          </div>
        )}
      </div>

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
