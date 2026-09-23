import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useAccount } from "@word-lock/client";
import {
  DEFAULT_STAR_RANGE,
  rangeDelta,
  sliceRange,
  STAR_RANGES,
  type StarPoint,
  type StarRangeId,
  type StatsOverview,
} from "@word-lock/core/game";
import { colors } from "@word-lock/tokens/native";

import { StarChart } from "@/components/StarChart";
import { useTheme } from "@/theme/ThemeProvider";

export function StatisticsCard({
  starHistory,
  overview,
}: {
  starHistory: StarPoint[];
  overview: StatsOverview;
}) {
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];
  const { data: account } = useAccount();
  const [range, setRange] = useState<StarRangeId>(DEFAULT_STAR_RANGE);

  const selected = STAR_RANGES.find((r) => r.id === range)!;

  const now = useMemo(
    () => (starHistory.length ? new Date(starHistory[starHistory.length - 1].t) : new Date()),
    [starHistory],
  );

  const points = useMemo(
    () => sliceRange(starHistory, selected, now),
    [starHistory, selected, now],
  );
  const delta = rangeDelta(points);
  const stars = account?.stars ?? points[points.length - 1]?.stars ?? 0;

  return (
    <View className="pb-16 pt-5">
      <View className="flex-row items-baseline justify-between gap-3 px-4 pt-2">
        <View className="flex-row items-baseline gap-2">
          <Text className="font-display text-4xl font-bold tabular-nums text-foreground">
            {stars}
          </Text>
          <TrendLabel delta={delta} />
        </View>
        <Text className="text-[13px] font-semibold text-mutedForeground">
          Peak {account?.peakStars ?? stars}
        </Text>
      </View>

      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Chart range"
        className="mt-10 flex-row items-center justify-around gap-4 px-6"
      >
        {STAR_RANGES.map((option) => {
          const active = option.id === range;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => setRange(option.id)}
              className="rounded-sm px-3 py-1.5"
              style={{ backgroundColor: active ? palette.muted : "transparent" }}
            >
              <Text
                className="text-xs font-bold tracking-wide"
                style={{ color: active ? palette.foreground : palette.mutedForeground }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-10">
        {points.length > 1 ? (
          <StarChart points={points} />
        ) : (
          <View className="h-56 items-center justify-center px-6">
            <Text className="font-sans text-center text-sm text-mutedForeground">
              Play a few ranked games and your star history will show up here.
            </Text>
          </View>
        )}
      </View>

      <View className="mt-10 flex-row gap-2 pt-4">
        <Stat label="Games" value={overview.total} />
        <Stat label="Wins" value={overview.wins} share={share(overview.wins, overview.total)} />
        <Stat label="Draws" value={overview.draws} share={share(overview.draws, overview.total)} />
        <Stat
          label="Losses"
          value={overview.losses}
          share={share(overview.losses, overview.total)}
        />
      </View>
    </View>
  );
}

function TrendLabel({ delta }: { delta: number | null }) {
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];

  if (delta === null) return null;

  if (delta === 0) {
    return (
      <Text className="text-sm font-bold tabular-nums" style={{ color: palette.mutedForeground }}>
        no change
      </Text>
    );
  }

  const up = delta > 0;

  return (
    <View className="flex-row items-center gap-0.5">
      <TrendArrow up={up} color={up ? palette.mint : palette.p1} />
      <Text
        className="text-sm font-bold tabular-nums"
        style={{ color: up ? palette.mint : palette.p1 }}
      >
        {Math.abs(delta)}
      </Text>
    </View>
  );
}

function TrendArrow({ up, color }: { up: boolean; color: string }) {
  return (
    <Svg
      width={10}
      height={12}
      viewBox="0 0 10 12"
      style={{ transform: [{ rotate: up ? "0deg" : "180deg" }] }}
    >
      <Path d="M5 0.5 9.5 6H6.2v5.5H3.8V6H0.5z" fill={color} />
    </Svg>
  );
}

function share(part: number, total: number): string | null {
  if (total === 0) return null;
  return `${Math.round((part / total) * 100)}%`;
}

function Stat({ label, value, share }: { label: string; value: number; share?: string | null }) {
  return (
    <View className="flex-1 items-center gap-0.5">
      <Text className="font-display text-2xl font-bold tabular-nums text-foreground">{value}</Text>
      <Text className="font-sans text-[0.65rem] uppercase tracking-wide text-mutedForeground">
        {label}
        {share && <Text className="ml-1 tabular-nums normal-case">{` ${share}`}</Text>}
      </Text>
    </View>
  );
}
