import { useAccount, useLeaderboard } from "@word-lock/client";
import { LEAGUES, leagueById, type LeagueId } from "@word-lock/core/account";
import { LeagueIcon, LEAGUE_TEXT_COLOR, QuestionMarkIcon, StarIcon } from "@word-lock/icons/native";
import { useCallback, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconButton } from "@/components/IconButton";
import { LeagueGuideSheet } from "@/components/LeagueGuideSheet";

const PROMOTION_SIZE = 3;

export default function LeaderboardScreen() {
  const { data: account } = useAccount();
  const { data, isLoading } = useLeaderboard();
  const [guideOpen, setGuideOpen] = useState(false);

  const league = data?.league ?? "bronze";
  const entries = data?.entries ?? [];
  const me = data?.me ?? null;

  const myRank = me?.leagueRank ?? null;
  const inList = myRank !== null && entries.some((e) => e.rank === myRank);

  const demotionStart = Math.max(entries.length - PROMOTION_SIZE, PROMOTION_SIZE);

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
              <View className="gap-2.5">
                {entries.map((entry, index) => (
                  <View key={entry.playerId} className="gap-2.5">
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
      style={{ paddingTop: Math.max(insets.top, 24) }}
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
          radius={6}
          accessibilityLabel="League tiers"
          onPress={onOpenGuide}
        >
          <QuestionMarkIcon size={18} />
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

function ZoneDivider({ kind }: { kind: "promotion" | "demotion" }) {
  const isPromotion = kind === "promotion";
  return (
    <View className="flex-row items-center justify-center gap-1.5 py-1">
      <Text
        className={
          isPromotion ? "font-sans text-xs text-mint" : "font-sans text-xs text-destructive"
        }
      >
        {isPromotion ? "▲" : "▼"}
      </Text>
      <Text
        className={
          isPromotion
            ? "text-[0.7rem] font-bold uppercase tracking-wide text-mint"
            : "text-[0.7rem] font-bold uppercase tracking-wide text-destructive"
        }
      >
        {isPromotion ? "Promotion zone" : "Demotion zone"}
      </Text>
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
      className={`-mx-5 flex-row items-center gap-3.5 py-6 pl-5 pr-6 ${isViewer ? "bg-surface" : ""}`}
    >
      <Text
        className="w-5 shrink-0 text-center text-sm font-semibold text-accent"
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {rank}
      </Text>

      <Text numberOfLines={1} className="min-w-0 flex-1 text-sm font-semibold text-foreground">
        {name}
        {isViewer && (
          <Text className="ml-1.5 text-xs font-normal text-mutedForeground"> (you)</Text>
        )}
      </Text>

      <View className="shrink-0 flex-row items-center gap-1 rounded-full bg-surface px-2.5 py-1">
        <StarIcon size={18} color={LEAGUE_TEXT_COLOR[league]} />
        <Text className="text-sm font-semibold" style={{ color: LEAGUE_TEXT_COLOR[league] }}>
          {stars}
        </Text>
      </View>
    </View>
  );
}

function LeaderboardSkeleton() {
  return (
    <View className="gap-2.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} className="h-14 rounded-md bg-surface" />
      ))}
    </View>
  );
}
