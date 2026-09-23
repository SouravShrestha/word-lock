import { Pressable, Text, View } from "react-native";
import { LiveIcon } from "@word-lock/icons/native";
import type { ReviewFrame } from "@word-lock/core/game";
import { colors } from "@word-lock/tokens/native";

import { useTheme } from "@/theme/ThemeProvider";

export function ReviewBar({
  frame,
  moveCount,
  isPlayerOne,
  onLive,
}: {
  frame: ReviewFrame;
  moveCount: number;
  isPlayerOne: boolean;
  onLive: () => void;
}) {
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];
  const { move, moveNumber } = frame;
  const word = move.passed
    ? "Passed"
    : move.word.charAt(0).toUpperCase() + move.word.slice(1).toLowerCase();

  return (
    <View
      className="h-12 w-full flex-row items-center justify-between gap-3 rounded-sm px-4 py-3"
      style={{ backgroundColor: palette.board }}
    >
      <Text className="shrink-0 text-xs font-medium tabular-nums text-mutedForeground">
        {moveNumber} / {moveCount}
      </Text>

      <Text
        numberOfLines={1}
        className="min-w-0 flex-1 text-center font-display text-sm font-medium tracking-widest"
        style={{
          color: move.passed ? palette.mutedForeground : isPlayerOne ? palette.p1 : palette.p2,
        }}
      >
        {word}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to live"
        onPress={onLive}
        className="shrink-0 py-0.5"
      >
        <LiveIcon size={32} />
      </Pressable>
    </View>
  );
}
