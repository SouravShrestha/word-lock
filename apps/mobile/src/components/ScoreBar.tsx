import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { timeLeftLabel } from "@word-lock/core/game";
import { ClockIcon } from "@word-lock/icons/native";
import { colors } from "@word-lock/tokens/native";

import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/theme/ThemeProvider";

function TurnClock({ deadline, status }: { deadline: string | null; status: string }) {
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];
  const [, setTick] = useState(0);

  useEffect(() => {
    if (status !== "active") return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  const timerLabel = status === "active" && deadline ? timeLeftLabel(deadline) : null;

  return (
    <View className="items-center gap-1.5">
      <ClockIcon size={16} color={palette.foreground} />
      <Text className="font-display text-xs font-medium tabular-nums text-foreground">
        {timerLabel ?? (status === "completed" ? "Game over" : "-")}
      </Text>
    </View>
  );
}

function formatScore(score: number) {
  return String(score).padStart(2, "0");
}

function PlayerChip({
  player,
  score,
  active,
  slot,
  mirrored,
  reaction,
}: {
  player: { name: string; avatar?: string | null } | null;
  score: number;
  active: boolean;
  slot: 1 | 2;
  mirrored: boolean;
  reaction?: { key: number; emoji: string } | null;
}) {
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];
  const ring = slot === 1 ? palette.p1 : palette.p2;
  const scoreColor = slot === 1 ? palette.p1 : palette.p2;

  return (
    <View className={`flex-1 flex-row items-center gap-2 ${mirrored ? "flex-row-reverse" : ""}`}>
      <View className="items-center gap-1.5">
        {reaction && (
          <Text key={reaction.key} className="font-sans absolute -top-1 z-10 text-2xl">
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
        <Text
          numberOfLines={1}
          className="font-sans mt-1.5 max-w-[64px] text-center text-xs leading-none"
          style={{ color: active ? palette.foreground : palette.mutedForeground }}
        >
          {player?.name ?? "-"}
        </Text>
      </View>
      <Text
        className="mx-4 font-display text-3xl font-bold leading-none tabular-nums"
        style={{ color: active ? scoreColor : palette.mutedForeground }}
      >
        {formatScore(score)}
      </Text>
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

  const chipFor = (slot: 1 | 2) => ({
    slot,
    player: slot === 1 ? game.players.one : game.players.two,
    score: (scores ?? game.scores)[slot],
    active: slot === 1 ? p1Active : p2Active,
    reaction: reaction?.slot === slot ? reaction : null,
  });

  return (
    <View className="px-2 py-2">
      <View className="flex-row items-center gap-2">
        <PlayerChip {...chipFor(nearSlot)} mirrored={false} />
        <TurnClock deadline={game.turnDeadline} status={game.status} />
        <PlayerChip {...chipFor(farSlot)} mirrored />
      </View>
    </View>
  );
}
