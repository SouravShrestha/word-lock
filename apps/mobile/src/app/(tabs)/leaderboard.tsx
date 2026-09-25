import { useAccount, useLeaderboard } from "@word-lock/client";
import { LEAGUES, leagueById, type LeagueId } from "@word-lock/core/account";
import { LeagueIcon, LEAGUE_TEXT_COLOR, QuestionMarkIcon, StarIcon } from "@word-lock/icons/native";
import { useCallback, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@word-lock/tokens/native";

import { IconButton } from "@/components/IconButton";
import { LeagueGuideSheet } from "@/components/LeagueGuideSheet";
import { Shimmer } from "@/components/Shimmer";
import { useTheme } from "@/theme/ThemeProvider";

export default function LeaderboardScreen() {
  const { data: account } = useAccount();
  const { data, isLoading } = useLeaderboard();
  const [guideOpen, setGuideOpen] = useState(false);

  const league = data?.league ?? "bronze";
  const entries = data?.entries ?? [];
  const me = data?.me ?? null;

  const myRank = me?.leagueRank ?? null;
  const inList = myRank !== null && entries.some((e) => e.rank === myRank);

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <LeagueHeader league={league} onOpenGuide={() => setGuideOpen(true)} />

        <View className="gap-4 px-5 pt-5">
          {isLoading ? (
            <LeaderboardSkeleton />
          ) : entries.length === 0 ? (
            <Text className="px-1 py-6 text-center text-sm font-semibold text-mutedForeground">
              Nothing here yet.
            </Text>
          ) : (
            <>
              <View className="gap-2">
                {entries.map((entry, index) => (
                  <View key={entry.playerId} className="gap-2.5">
                    <Row
                      rank={entry.rank}
                      name={entry.username}
                      stars={entry.stars}
                      league={entry.league}
                      isViewer={entry.playerId === account?.playerId}
                    />
                  </View>
                ))}
              </View>

              {me && myRank !== null && !inList && account?.username && (
                <>
                  <Text className="text-center text-xs font-semibold text-mutedForeground">
                    ···
                  </Text>
                  <Row
                    rank={myRank}
                    name={account.username}
                    stars={me.stars}
                    league={me.league}
                    isViewer
                  />
                </>
              )}

              {!me && (
                <Text className="px-1 text-center text-xs font-semibold text-mutedForeground">
                  Pick a username to join the board.
                </Text>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <LeagueGuideSheet open={guideOpen} onClose={() => setGuideOpen(false)} />
    </View>
  );
}

function LeagueHeader({ league, onOpenGuide }: { league: LeagueId; onOpenGuide: () => void }) {
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];
  const band = leagueById(league);
  const index = LEAGUES.findIndex((tier) => tier.id === league);
  const scrollRef = useRef<ScrollView>(null);
  const positionsRef = useRef<Record<number, number>>({});
  const insets = useSafeAreaInsets();

  const onTierLayout = useCallback(
    (i: number) => (e: { nativeEvent: { layout: { x: number; width: number } } }) => {
      positionsRef.current[i] = e.nativeEvent.layout.x;
      if (i === index) {
        const x = positionsRef.current[i];
        if (x !== undefined) {
          scrollRef.current?.scrollTo({ x: Math.max(x - 80, 0), animated: true });
        }
      }
    },
    [index],
  );

  return (
    <View
      className="border-b-2 border-hairline px-5 pb-6"
      style={{ paddingTop: Math.max(insets.top + 20, 24) }}
    >
      <View className="flex-row items-center justify-between gap-4">
        <Text
          className="font-display text-3xl font-bold"
          style={{ color: LEAGUE_TEXT_COLOR[league] }}
        >
          {band.name} League
        </Text>
        <IconButton
          variant="surface"
          size={36}
          accessibilityLabel="League tiers"
          onPress={onOpenGuide}
        >
          <QuestionMarkIcon size={16} color={palette.foreground} />
        </IconButton>
      </View>

      <Text className="mt-1 text-sm font-semibold text-mutedForeground">
        {band.maxStars === null
          ? `${band.minStars}+ stars`
          : `${band.minStars} - ${band.maxStars} stars`}
      </Text>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        className="-mx-5 mt-5"
        contentContainerStyle={{ paddingHorizontal: 20, gap: 16, alignItems: "center" }}
      >
        {LEAGUES.map((tier, i) => (
          <View
            key={tier.id}
            onLayout={onTierLayout(i)}
            style={{ opacity: i > index ? 0.3 : i === index ? 1 : 0.8 }}
          >
            <LeagueIcon league={tier.id} size={i === index ? 96 : 64} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
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
    <View
      className={`-mx-5 flex-row items-center gap-3.5 py-5 pl-6 pr-6 mb-2 ${isViewer ? "bg-board" : ""}`}
    >
      <Text
        className="w-5 shrink-0 text-center text-[15px] font-semibold text-accent"
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {rank}
      </Text>

      <Text numberOfLines={1} className="min-w-0 flex-1 text-[15px] font-semibold text-foreground">
        {name}
        {isViewer && (
          <Text className="ml-1.5 text-[13px] font-normal text-mutedForeground"> (you)</Text>
        )}
      </Text>

      <View className="shrink-0 flex-row items-center gap-1 px-2.5 py-1">
        <StarIcon size={18} color={LEAGUE_TEXT_COLOR[league]} />
        <Text className="text-[15px] font-semibold" style={{ color: LEAGUE_TEXT_COLOR[league] }}>
          {stars}
        </Text>
      </View>
    </View>
  );
}

function LeaderboardSkeleton() {
  return (
    <View className="gap-2.5 px-1">
      {Array.from({ length: 8 }).map((_, i) => (
        <LeaderboardRowSkeleton key={i} />
      ))}
    </View>
  );
}

function LeaderboardRowSkeleton() {
  return (
    <View className="-mx-5 flex-row items-center gap-3.5 py-6 pl-5 pr-6">
      <Shimmer className="h-4 w-5 shrink-0 rounded-sm" />
      <Shimmer className="h-4 w-32 min-w-0 flex-1 rounded-sm" />
      <Shimmer className="h-6 w-14 shrink-0 rounded-sm" />
    </View>
  );
}
