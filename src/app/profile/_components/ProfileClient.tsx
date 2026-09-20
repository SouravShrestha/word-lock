"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { BottomNav, BOTTOM_NAV_SPACER, NAV_SHELL } from "@/components/BottomNav";
import { SettingsIcon } from "@/components/icons/SettingsIcon";
import { SectionLabel } from "@/components/SectionLabel";
import { StreakPill, StarsPill } from "@/components/StatPills";
import { useSession } from "@/hooks/use-session";
import { useAccount } from "@/hooks/use-account";
import { fetchProfileFn } from "@/lib/game/api.client";

import { MAX_RECENT_GAMES, type PlayerStats, type RecentGameEntry } from "@/lib/game/stats";
import { ProfileIdentity } from "./ProfileIdentity";
import { SettingsSheet } from "./SettingsSheet";
import { OverviewCard } from "./OverviewCard";
import { StatisticsCard } from "./StatisticsCard";
import { RecentGamesCard } from "./RecentGamesCard";
import { GameDetailPopup } from "./GameDetailPopup";

/**
 * The profile: who you are, where you stand, and how you got there.
 *
 * Two labelled sections under the identity block. Overview is the standings a
 * player checks at a glance and comes from the account summary, so it renders as
 * soon as that lands. Statistics is the history — the star curve and the record —
 * and waits on the profile query, which is the slower of the two.
 */
export function ProfileClient() {
  const { sessionId, ready } = useSession();
  const { data: account } = useAccount();
  const [selectedEntry, setSelectedEntry] = useState<RecentGameEntry | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data, isLoading } = useQuery<PlayerStats>({
    queryKey: ["profile", sessionId],
    enabled: ready,
    queryFn: () => fetchProfileFn({ sessionId: sessionId! }),
  });

  const overview = data?.overview;
  const loading = !ready || isLoading;

  return (
    <main className={NAV_SHELL}>
      <div className={`flex flex-1 flex-col overflow-y-auto px-5 ${BOTTOM_NAV_SPACER}`}>
        <div className="flex items-center justify-end gap-3 pt-5">
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

          <section className="flex flex-col gap-3">
            <SectionLabel>Overview</SectionLabel>
            <OverviewCard />
          </section>

          <section className="flex flex-col gap-3">
            <SectionLabel>Statistics</SectionLabel>
            {loading ? (
              <div className="surface h-10 animate-pulse rounded-sm" />
            ) : overview && overview.total > 0 ? (
              <StatisticsCard starHistory={data!.starHistory} overview={overview} />
            ) : (
              <div className="surface p-6 text-center">
                <p className="font-display text-lg font-bold">No games finished yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Go play one!</p>
              </div>
            )}
          </section>
        </div>
      </div>

      <BottomNav />

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
