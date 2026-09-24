import { ScrollView, Text, View } from "react-native";
import { colors } from "@word-lock/tokens/native";

import { useTheme } from "@/theme/ThemeProvider";

export function PlayedWords({
  game,
}: {
  game: {
    playedWords: { word: string; playerId: string }[];
    players: { one: { id: string } | null; two: { id: string } | null };
  };
}) {
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];
  const entries = [...game.playedWords].reverse();

  if (entries.length === 0) {
    return (
      <View
        style={{ backgroundColor: palette.board }}
        className="flex-1 items-center justify-center"
      >
        <Text
          className="font-sans text-[15px] leading-none pt-1"
          style={{ color: palette.foreground }}
        >
          No words
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ backgroundColor: palette.board }}
      contentContainerStyle={{
        alignItems: "center",
        gap: 28,
        paddingHorizontal: 20,
      }}
    >
      {entries.map((entry, i) => (
        <Text
          key={i}
          className="font-sans shrink-0 text-[15px] leading-none pt-1"
          style={{ color: entry.playerId === game.players.one?.id ? palette.p1 : palette.p2 }}
        >
          {entry.word.charAt(0).toUpperCase() + entry.word.slice(1).toLowerCase()}
        </Text>
      ))}
    </ScrollView>
  );
}
