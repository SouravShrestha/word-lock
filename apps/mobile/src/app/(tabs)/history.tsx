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
        {loading ? (
          <HistorySkeleton />
        ) : (
          <>
            <Headline wins={data?.overview.wins ?? 0} />

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
              <View className="mt-3 gap-1.5 pb-8 pt-1">
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
    <View className="px-5" style={{ paddingTop: Math.max(insets.top, 32) }}>
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
    <View className="gap-3 px-5 pt-8">
      <View className="h-8 w-40 rounded-md bg-surface" />
      <View className="mt-4 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} className="h-14 rounded-md bg-surface" />
        ))}
      </View>
    </View>
  );
}
