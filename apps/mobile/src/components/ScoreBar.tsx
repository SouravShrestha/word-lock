import { Text } from "@/components/text";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { clockLabelFor } from "@word-lock/core/game";
import { ClockIcon } from "@word-lock/icons/native";
import { colors } from "@word-lock/tokens/native";

import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/theme/ThemeProvider";

function formatScore(score: number) {
  return String(score).padStart(2, "0");
}

/**
 * One player's corner of the bar — the native mirror of the web chip:
 *
 *   [avatar] [clock]        [clock] [avatar]
 *   [name]   [score]        [score] [name]
 *
 * RN has no CSS grid, so it is two rows sharing a fixed identity-column width
 * (the name's own cap), which is what keeps each clock level with its avatar
 * and each score level with its name.
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
  const numberColor = active ? ring : palette.mutedForeground;
  const row = `flex-row items-center gap-3 ${mirrored ? "flex-row-reverse" : ""}`;

  return (
    <View className="gap-2">
      <View className={row} style={{ height: 44 }}>
        <View className="w-16 items-center">
          {reaction && (
            <Text variant="autoGen20" key={reaction.key} className="absolute top-1.5 z-10">
              {reaction.emoji}
            </Text>
          )}
          <View
            className="rounded-full"
            style={{
              padding: active ? 3 : 2,
              borderWidth: active ? 3 : 2,
              borderColor: ring,
              opacity: active ? 1 : 0.6,
            }}
          >
            <Avatar avatar={player?.avatar} size={32} />
          </View>
        </View>
        <View className={`items-center gap-1 ${mirrored ? "flex-row-reverse" : "flex-row"}`}>
          <ClockIcon size={14} color={numberColor} />
          <Text variant="timer" style={{ color: numberColor }}>
            {clock}
          </Text>
        </View>
      </View>
      <View className={row}>
        <Text
          variant="body"
          numberOfLines={1}
          className="w-16 text-center text-xs leading-none"
          style={{ color: active ? palette.foreground : palette.mutedForeground }}
        >
          {player?.name ?? "-"}
        </Text>
        <Text variant="score" className="text-2xl leading-none" style={{ color: numberColor }}>
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
    <View className="px-2 py-2">
      <View className="flex-row items-center justify-between gap-4">
        <PlayerChip {...chipFor(nearSlot)} mirrored={false} />
        <PlayerChip {...chipFor(farSlot)} mirrored />
      </View>
    </View>
  );
}
