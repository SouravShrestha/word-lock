import type { ComponentType } from "react";
import { Pressable, Text, View } from "react-native";
import { DrawFaceIcon, LossFaceIcon, WinFaceIcon, type IconProps } from "@word-lock/icons/native";
import type { GameResult, RecentGameEntry } from "@word-lock/core/game";
import { colors } from "@word-lock/tokens/native";

import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/theme/ThemeProvider";

export function MatchRow({
  entry,
  onSelect,
}: {
  entry: RecentGameEntry;
  onSelect: (entry: RecentGameEntry) => void;
}) {
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onSelect(entry)}
      className="flex-row items-center gap-3.5 px-5 py-3.5"
    >
      <Avatar avatar={entry.opponentAvatar} />

      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="font-display text-base font-medium text-foreground">
          {entry.opponentName}
        </Text>

        <View className="mt-1 flex-row items-center gap-3">
          <StarMeta delta={entry.starDelta} />
          <ResultMeta result={entry.result} />
        </View>
      </View>

      <Text className="shrink-0 text-sm font-semibold tracking-wide" style={{ color: palette.sky }}>
        Details
      </Text>
    </Pressable>
  );
}

function StarMeta({ delta }: { delta: number | null }) {
  if (delta === null) {
    return <Text className="text-xs font-semibold text-mutedForeground">Unranked</Text>;
  }

  return (
    <Text
      className="text-xs font-semibold text-mutedForeground"
      style={{ fontVariant: ["tabular-nums"] }}
    >
      {delta > 0 ? `+ ${delta}` : `- ${Math.abs(delta)}`} stars
    </Text>
  );
}

const RESULT_MARK = {
  win: { Icon: WinFaceIcon, label: "Win" },
  loss: { Icon: LossFaceIcon, label: "Loss" },
  draw: { Icon: DrawFaceIcon, label: "Draw" },
} satisfies Record<GameResult, { Icon: ComponentType<IconProps>; label: string }>;

function ResultMeta({ result }: { result: GameResult }) {
  const { Icon, label } = RESULT_MARK[result];

  return (
    <View className="flex-row items-center gap-1">
      <Icon size={14} />
      <Text className="text-xs font-semibold text-mutedForeground">{label}</Text>
    </View>
  );
}
