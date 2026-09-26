import { Text } from "@/components/text";
import { View } from "react-native";
import { colors } from "@word-lock/tokens/native";

import { useTheme } from "@/theme/ThemeProvider";

export function WordPreview({ letters, yourTurn }: { letters: string[]; yourTurn: boolean }) {
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];
  const word = letters.join("");

  return (
    <View
      className="h-12 w-full items-center justify-center rounded-sm px-4 py-3"
      style={{ backgroundColor: palette.board }}
    >
      {word.length === 0 ? (
        <Text
          variant="autoGen31"

          style={{ color: `${palette.foreground}e6` }}
        >
          {yourTurn ? "Select tiles to form a word" : "Opponent's turn"}
        </Text>
      ) : (
        <Text variant="autoGen32">{word}</Text>
      )}
    </View>
  );
}
