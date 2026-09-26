import { Text } from "@/components/text";
import { Pressable, View, ScrollView } from "react-native";
import { colors } from "@word-lock/tokens/native";

import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { Tile, type TileOwner } from "@/components/Tile";
import { useTheme } from "@/theme/ThemeProvider";

export interface ResultGame {
  grid: string[];
  owners: number[];
  locked: boolean[];
  scores: { 1: number; 2: number };
  endReason: string | null;
  winnerId: string | null;
  viewerSlot: 1 | 2 | null;
  starDeltas?: { 1: number | null; 2: number | null };
  players: {
    one: { id: string; name: string; avatar?: string | null } | null;
    two: { id: string; name: string; avatar?: string | null } | null;
  };
  playedWords: { word: string; playerId: string }[];
}

export function GameResultCard({
  game,
  onExit,
  exitLabel = "Exit",
  action,
  note,
}: {
  game: ResultGame;
  onExit: () => void;
  exitLabel?: string;
  action?: { label: string; onPress: () => void; pending?: boolean } | null;
  note?: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];

  const nearSlot: 1 | 2 = game.viewerSlot === 2 ? 2 : 1;
  const farSlot: 1 | 2 = nearSlot === 1 ? 2 : 1;
  const playerFor = (slot: 1 | 2) => (slot === 1 ? game.players.one : game.players.two);

  return (
    <View
      className="w-full overflow-hidden rounded-lg border-2 border-border"
      style={{ backgroundColor: palette.surface }}
    >
      <View className="px-4 pb-4 pt-5" style={{ backgroundColor: palette.board }}>
        <View className="flex-row items-start justify-between gap-2">
          <PlayerColumn
            slot={nearSlot}
            player={playerFor(nearSlot)}
            score={game.scores[nearSlot]}
          />

          <View className="min-w-0 flex-1 items-center gap-1 pt-4">
            <Text variant="heading" className="leading-none">
              {verdict(game)}
            </Text>
            <Text variant="body" className="text-center leading-tight">
              {reasonLabel(game)}
            </Text>
            <StarDelta game={game} />
          </View>

          <PlayerColumn slot={farSlot} player={playerFor(farSlot)} score={game.scores[farSlot]} />
        </View>

        {note && <View className="mt-3 items-center">{note}</View>}
      </View>

      <View
        className="border-y px-4 py-2.5"
        style={{ borderColor: palette.border, backgroundColor: palette.surface }}
      >
        {game.playedWords.length === 0 ? (
          <View className="items-center justify-center">
            <Text variant="body">no words played</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row items-center gap-6">
              {game.playedWords.map((entry, i) => (
                <Text
                  key={i}
                  variant="body"
                  className="shrink-0 leading-none"
                  style={{
                    color: entry.playerId === game.players.one?.id ? palette.p1 : palette.p2,
                  }}
                >
                  {entry.word.charAt(0).toUpperCase() + entry.word.slice(1).toLowerCase()}
                </Text>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      <View className="p-3" style={{ backgroundColor: palette.board }}>
        <View
          className="w-full flex-row flex-wrap border-l border-t"
          style={{ borderColor: palette.border }}
        >
          {game.grid.map((letter, index) => (
            <View key={index} style={{ width: "20%" }}>
              <Tile
                letter={letter}
                owner={game.owners[index] as TileOwner}
                locked={game.locked[index]}
                disabled
              />
            </View>
          ))}
        </View>
      </View>

      <View className="flex-row gap-3 px-3 pb-4" style={{ backgroundColor: palette.board }}>
        <Button variant="surface" className="flex-1" onPress={onExit}>
          {exitLabel}
        </Button>

        {action && (
          <Button
            variant="sky"
            className="flex-1"
            disabled={action.pending}
            loading={action.pending}
            onPress={action.onPress}
          >
            {action.label}
          </Button>
        )}
      </View>
    </View>
  );
}

function PlayerColumn({
  slot,
  player,
  score,
}: {
  slot: 1 | 2;
  player: { name: string; avatar?: string | null } | null;
  score: number;
}) {
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];

  return (
    <View className="w-20 shrink-0 items-center gap-2">
      <View
        className="rounded-full"
        style={{
          padding: 2,
          borderWidth: 3,
          borderColor: slot === 1 ? palette.p1 : palette.p2,
          backgroundColor: palette.board,
        }}
      >
        <Avatar avatar={player?.avatar} size={52} />
      </View>
      <Text
        variant="body"
        numberOfLines={1}
        className="max-w-full text-xs leading-none text-foreground"
      >
        {player?.name ?? "-"}
      </Text>
      <Text
        variant="statMd"
        className="leading-none"
        style={{ color: slot === 1 ? palette.p1 : palette.p2 }}
      >
        {score}
      </Text>
    </View>
  );
}

function verdict(game: ResultGame) {
  const winnerSlot =
    game.winnerId === game.players.one?.id ? 1 : game.winnerId === game.players.two?.id ? 2 : null;

  if (winnerSlot === null) return "Draw";

  if (game.viewerSlot === null) {
    const winner = winnerSlot === 1 ? game.players.one : game.players.two;
    return `${winner?.name ?? "Player"} wins`;
  }

  return game.viewerSlot === winnerSlot ? "You Win" : "You Lose";
}

function reasonLabel(game: ResultGame) {
  if (game.endReason === "forfeit") {
    const viewerWon = game.viewerSlot !== null && game.winnerId === playerId(game, game.viewerSlot);
    if (game.viewerSlot === null) return "Forfeited";
    return viewerWon ? "Opponent left" : "You left the game";
  }
  if (game.endReason === "double-pass") return "Both players passed";
  return "Board filled";
}

function playerId(game: ResultGame, slot: 1 | 2) {
  return slot === 1 ? game.players.one?.id : game.players.two?.id;
}

function StarDelta({ game }: { game: ResultGame }) {
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];
  const slot = game.viewerSlot;
  const delta = slot ? (game.starDeltas?.[slot] ?? null) : null;

  if (delta === null) return null;

  return (
    <Text
      variant="timer"
      className="mt-0.5 font-bold"
      style={{ color: delta > 0 ? palette.mint : palette.mutedForeground }}
    >
      {delta > 0 ? "+" : ""}
      {delta} stars
    </Text>
  );
}
