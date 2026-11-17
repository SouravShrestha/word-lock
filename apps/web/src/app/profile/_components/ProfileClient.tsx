"use client";
import { useSession, useAccount, fetchProfileFn } from "@word-lock/client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { BackButton } from "@/components/BackButton";
import { SettingsIcon } from "@/components/icons/SettingsIcon";
import { StreakPill, StarsPill } from "@/components/StatPills";

import { MAX_RECENT_GAMES, type PlayerStats, type RecentGameEntry } from "@word-lock/core/game";
import { ProfileIdentity } from "./ProfileIdentity";
import { SettingsSheet } from "./SettingsSheet";
import { StatisticsCard } from "./StatisticsCard";
import { RecentGamesCard } from "./RecentGamesCard";
import { GameDetailPopup } from "./GameDetailPopup";

/**
 * The profile: who you are, where you stand, and how you got there.
 *
 * Under the identity block sits the statistics card — the star curve and the
 * record — which waits on the profile query.
 */
export function ProfileClient() {
  const { sessionId, ready } = useSession();
  const { data: account } = useAccount();
  const [selectedEntry, setSelectedEntry] = useState<RecentGameEntry | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
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

  const overview = data?.overview;
  const loading = !ready || isLoading;

  return (
    <main
      className={`relative mx-auto flex h-dvh w-full max-w-2xl flex-col overflow-hidden${leaving ? " slide-to-right" : ""}`}
      onAnimationEnd={(e) => {
        if (leaving && e.target === e.currentTarget) router.push("/");
      }}
    >
      <div className="flex flex-1 flex-col overflow-y-auto px-5 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-3 pt-5">
          <BackButton onClick={goBack} />
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
            className="soft-icon-btn btn-surface h-9 w-9"
          >
            <SettingsIcon className="h-[1.1rem] w-[1.1rem]" />
          </button>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
          <ProfileIdentity
            username={account?.username}
            avatar={account?.avatar}
            joinedAt={account?.joinedAt}
          />
          <div className="mt-2 h-px bg-hairline opacity-60" />

          {loading ? (
            <div className="surface h-10 animate-pulse rounded-sm" />
          ) : overview && overview.total > 0 ? (
            <StatisticsCard starHistory={data!.starHistory} overview={overview} />
          ) : (
            <div className="p-6 text-center">
              <p className="font-display tv-heading">No games finished yet</p>
              <p className="mt-1 tv-body text-muted-foreground">Go play one!</p>
            </div>
          )}
        </div>
      </div>

      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />

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
