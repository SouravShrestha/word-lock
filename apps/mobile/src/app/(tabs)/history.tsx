import { fetchProfileFn, useAccount, useSession } from "@word-lock/client";
import type { PlayerStats, RecentGameEntry } from "@word-lock/core/game";
import { LeagueIcon, LEAGUE_TEXT_COLOR } from "@word-lock/icons/native";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GameDetailPopup } from "@/components/GameDetailPopup";
import { MatchRow } from "@/components/MatchRow";
import { SectionLabel } from "@/components/SectionLabel";
import { Shimmer } from "@/components/Shimmer";

export default function HistoryScreen() {
  const { sessionId, ready } = useSession();
  const [selected, setSelected] = useState<RecentGameEntry | null>(null);

  const { data, isLoading } = useQuery<PlayerStats>({
    queryKey: ["profile", sessionId],
    enabled: ready && !!sessionId,
    queryFn: () => fetchProfileFn({ sessionId: sessionId! }),
  });

  const games = data?.recentGames ?? [];
  const loading = !ready || isLoading;

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <Headline wins={data?.overview.wins ?? 0} />
        {loading ? (
          <HistorySkeleton />
        ) : (
          <>
            <SectionLabel className="mx-5 mt-7">Match history</SectionLabel>

            {games.length === 0 ? (
              <View className="mt-6 items-center p-6">
                <Text className="font-display text-lg font-bold text-foreground">
                  Nothing here yet
                </Text>
                <Text className="font-sans mt-1 text-center text-sm text-mutedForeground">
                  Finish a game to see it listed.
                </Text>
              </View>
            ) : (
              <View className="mt-3 gap-2.5 pb-8 pt-1 mx-1">
                {games.map((entry) => (
                  <MatchRow key={entry.gameId} entry={entry} onSelect={setSelected} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {selected && sessionId && (
        <GameDetailPopup entry={selected} sessionId={sessionId} onClose={() => setSelected(null)} />
      )}
    </View>
  );
}

function Headline({ wins }: { wins: number }) {
  const { data: account } = useAccount();
  const league = account?.league ?? "bronze";
  const insets = useSafeAreaInsets();

  return (
    <View className="px-5" style={{ paddingTop: Math.max(insets.top + 24, 24) }}>
      <Text className="font-display text-3xl font-bold text-foreground">Your matches</Text>

      <View className="mt-2 flex-row items-center gap-1.5">
        <LeagueIcon league={league} size={24} />
        <Text
          className="text-sm font-semibold"
          style={{ color: LEAGUE_TEXT_COLOR[league], fontVariant: ["tabular-nums"] }}
        >
          {account?.stars ?? 0}
        </Text>
      </View>
    </View>
  );
}

function HistorySkeleton() {
  return (
    <View accessibilityElementsHidden={true} importantForAccessibility="no-hide-descendants">
      <View className="mt-3 flex-col pt-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <MatchRowSkeleton key={i} />
        ))}
      </View>
    </View>
  );
}

function MatchRowSkeleton() {
  return (
    <View className="mt-1.5 w-full flex-row items-center gap-3.5 px-5 py-3.5">
      <Shimmer className="h-14 w-14 shrink-0 rounded-full" />

      <View className="min-w-0 flex-1">
        <Shimmer className="h-4 w-28 rounded-sm" />
        <View className="mt-2 flex-row items-center gap-3">
          <Shimmer className="h-3 w-16 rounded-sm" />
          <Shimmer className="h-3 w-12 rounded-sm" />
        </View>
      </View>

      <Shimmer className="h-4 w-14 shrink-0 rounded-sm" />
    </View>
  );
}
