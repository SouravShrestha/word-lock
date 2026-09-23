import { ScrollView, Text } from "react-native";
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

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ backgroundColor: palette.board }}
      contentContainerStyle={{
        height: 32,
        alignItems: "center",
        gap: 28,
        paddingHorizontal: 20,
      }}
    >
      {entries.map((entry, i) => (
        <Text
          key={i}
          className="font-sans shrink-0 text-sm leading-none"
          style={{ color: entry.playerId === game.players.one?.id ? palette.p1 : palette.p2 }}
        >
          {entry.word.charAt(0).toUpperCase() + entry.word.slice(1).toLowerCase()}
        </Text>
      ))}
    </ScrollView>
  );
}
