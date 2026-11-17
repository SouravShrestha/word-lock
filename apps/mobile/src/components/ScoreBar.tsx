import { Text } from "@/components/text";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { clockLabelFor } from "@word-lock/core/game";
import { colors } from "@word-lock/tokens/native";

import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/theme/ThemeProvider";

function formatScore(score: number) {
  return String(score).padStart(2, "0");
}

/**
 * One player's corner of the bar — the native mirror of the web chip.
 * Grouped as columns:
 *
 *   [avatar/name] [time/score]      [time/score] [avatar/name]
 */
function PlayerChip({
  player,
  score,
  clock,
  active,
  slot,
  mirrored,
  reaction,
}: {
  player: { name: string; avatar?: string | null } | null;
  score: number;
  clock: string;
  active: boolean;
  slot: 1 | 2;
  mirrored: boolean;
  reaction?: { key: number; emoji: string } | null;
}) {
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];
  const ring = slot === 1 ? palette.p1 : palette.p2;
  const scoreColor = active ? ring : palette.mutedForeground;
  const cardColor = active ? (slot === 1 ? palette.p1Soft : palette.p2Soft) : palette.card;
  const borderColor = active ? ring : palette.border;
  const timeColor = active
    ? resolvedTheme === "dark"
      ? palette.foreground
      : ring
    : palette.mutedForeground;
  const row = `flex-row items-center gap-2 ${mirrored ? "flex-row-reverse" : ""}`;

  return (
    <View className={`${row} -mx-5 justify-between`}>
      <View className="w-20 items-center gap-1">
        {reaction && (
          <Text variant="autoGen20" key={reaction.key} className="absolute top-2 z-10 text-4xl">
            {reaction.emoji}
          </Text>
        )}
        <View
          className="rounded-full"
          style={{
            padding: active ? 3 : 2,
            borderWidth: active ? 3 : 2,
            borderColor: ring,
            opacity: active ? 1 : 0.85,
          }}
        >
          <Avatar avatar={player?.avatar} size={40} />
        </View>
        <Text
          variant="body"
          numberOfLines={1}
          className="text-center text-sm leading-none mt-2"
          style={{ color: active ? palette.foreground : palette.mutedForeground }}
        >
          {player?.name ?? "-"}
        </Text>
      </View>
      <View className={mirrored ? "items-center gap-1" : "items-center gap-2"}>
        <View
          className={`w-16 items-center rounded-md pb-2 pt-2.5 border-2`}
          style={{ backgroundColor: cardColor, borderColor: borderColor }}
        >
          <Text variant="score" className="text-sm leading-none" style={{ color: timeColor }}>
            {clock}
          </Text>
        </View>
        <Text
          variant="score"
          className="text-2xl leading-none mt-1.5"
          style={{ color: scoreColor }}
        >
          {formatScore(score)}
        </Text>
      </View>
    </View>
  );
}

export function ScoreBar({
  game,
  p1Active,
  p2Active,
  reaction,
  scores,
}: {
  game: {
    viewerSlot: 1 | 2 | null;
    turnDeadline: string | null;
    timeControl?: string | null;
    clocks?: { 1: number | null; 2: number | null } | null;
    status: string;
    scores: { 1: number; 2: number };
    players: {
      one: { name: string; avatar?: string | null } | null;
      two: { name: string; avatar?: string | null } | null;
    };
  };
  p1Active: boolean;
  p2Active: boolean;
  reaction?: { key: number; emoji: string; slot: 1 | 2 } | null;
  scores?: { 1: number; 2: number };
}) {
  const nearSlot: 1 | 2 = game.viewerSlot === 2 ? 2 : 1;
  const farSlot: 1 | 2 = nearSlot === 1 ? 2 : 1;

  // One ticker for both clocks, only while a turn is actually running.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (game.status !== "active") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [game.status]);

  const chipFor = (slot: 1 | 2) => ({
    slot,
    clock: clockLabelFor(game, slot, slot === 1 ? p1Active : p2Active, now),
    player: slot === 1 ? game.players.one : game.players.two,
    score: (scores ?? game.scores)[slot],
    active: slot === 1 ? p1Active : p2Active,
    reaction: reaction?.slot === slot ? reaction : null,
  });

  return (
    <View className="px-2 py-3">
      <View className="flex-row items-center justify-between gap-2 px-2">
        <PlayerChip {...chipFor(nearSlot)} mirrored={false} />
        <PlayerChip {...chipFor(farSlot)} mirrored />
      </View>
    </View>
  );
}
