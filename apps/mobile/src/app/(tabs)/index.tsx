import { createGameFn, fetchLobby, timeoutGameFn, useSession } from "@word-lock/client";
import { timeLeftLabel } from "@word-lock/core/game";
import { HeartIcon, PlayIcon } from "@word-lock/icons/native";
import { colors } from "@word-lock/tokens/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { HomeBackdrop } from "@/components/HomeBackdrop";
import { HowToPlaySheet } from "@/components/HowToPlaySheet";
import { Lip, lipPadding } from "@/components/lip";
import { SectionLabel } from "@/components/SectionLabel";
import { StarsPill, StreakPill } from "@/components/StatPills";
import { Wordmark } from "@/components/Wordmark";
import { toast } from "@/components/Toast";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/theme/ThemeProvider";

export default function HomeScreen() {
  const { sessionId, ready } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [rulesOpen, setRulesOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const { data } = useQuery({
    queryKey: ["lobby", sessionId],
    enabled: ready,
    queryFn: () => fetchLobby({ sessionId: sessionId! }),
  });

  const createMutation = useMutation({
    mutationFn: () => createGameFn({ sessionId: sessionId! }),
    onSuccess: ({ roomCode }: { roomCode: string }) => router.push(`/game/${roomCode}`),
    onError: (error: Error) => toast.error(error.message),
  });

  useEffect(() => {
    if (ready) queryClient.invalidateQueries({ queryKey: ["lobby"] });
  }, [ready, queryClient]);

  useEffect(() => {
    if (!ready) return;

    const channel = supabase
      .channel(`lobby-games-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "wl_games" }, () => {
        queryClient.invalidateQueries({ queryKey: ["lobby", sessionId] });
      })
      .subscribe();

    const pollInterval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["lobby", sessionId] });
    }, 15_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [ready, queryClient, sessionId]);

  const games = useMemo(() => data?.games ?? [], [data?.games]);
  const activeGames = useMemo(() => games.filter((g: LobbyGame) => g.status === "active"), [games]);
  const hasGames = activeGames.length > 0;

  return (
    <View className="flex-1 bg-background px-1">
      <HomeBackdrop />

      <View
        className="flex-row items-center justify-between px-7"
        style={{ paddingTop: Math.max(insets.top + 12, 20) }}
      >
        <StreakPill />
        <StarsPill />
      </View>

      <View className={hasGames ? "mt-10 flex-1" : "flex-1"}>
        <View
          className={
            hasGames ? "items-center pb-8 pt-4" : "flex-1 items-center justify-center pb-8"
          }
        >
          <Wordmark />

          <View className="mt-16 w-full max-w-sm flex-row gap-4 px-5">
            <Button
              variant="sky"
              className="flex-1"
              disabled={!ready || createMutation.isPending}
              loading={createMutation.isPending}
              onPress={() => createMutation.mutate()}
              icon={<PlayIcon size={12} color="#ffffff" />}
            >
              {createMutation.isPending ? "Creating" : "New Game"}
            </Button>
            <Button
              variant="blush"
              className="flex-1"
              onPress={() => router.push("/join")}
              icon={<HeartIcon size={12} color="#ffffff" />}
            >
              Join
            </Button>
          </View>
        </View>

        {hasGames && <GameList title="Continue your games" games={activeGames} />}
      </View>

      <View className="flex-row items-center justify-end px-6 pb-3.5 pt-2 mb-3">
        <Button variant="sun" size="sm" onPress={() => setRulesOpen(true)} className="rounded-lg">
          How to play?
        </Button>
      </View>

      <HowToPlaySheet open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </View>
  );
}

interface LobbyGame {
  id: string;
  roomCode: string;
  status: string;
  turnDeadline: string | null;
  currentTurnPlayerId: string | null;
  viewerSlot: 1 | 2 | null;
  scores: Record<number, number>;
  players: {
    one: { id: string; name: string } | null;
    two: { id: string; name: string } | null;
  };
}

function GameList({ title, games }: { title: string; games: LobbyGame[] }) {
  if (games.length === 0) return null;

  return (
    <View className="py-2 mt-6 -mx-1">
      <SectionLabel className="px-5 mb-2">{title}</SectionLabel>
      <FlatList
        data={games}
        keyExtractor={(game) => game.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 20, gap: 20 }}
        renderItem={({ item }) => <GameCard game={item} />}
      />
    </View>
  );
}

const CARD_LIP = 4;

function GameCard({ game }: { game: LobbyGame }) {
  const [, setTick] = useState(0);
  const [pressed, setPressed] = useState(false);
  const router = useRouter();
  const { sessionId } = useSession();
  const queryClient = useQueryClient();
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];

  useEffect(() => {
    if (game.status !== "active" || !game.turnDeadline) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [game.status, game.turnDeadline]);

  useEffect(() => {
    if (game.status !== "active" || !game.turnDeadline) return;

    const msLeft = new Date(game.turnDeadline).getTime() - Date.now();

    const triggerSweep = () => {
      if (!sessionId) return;
      timeoutGameFn({ sessionId, roomCode: game.roomCode })
        .then(() => queryClient.invalidateQueries({ queryKey: ["lobby"] }))
        .catch(console.error);
    };

    if (msLeft <= 0) {
      triggerSweep();
      return;
    }

    const timer = setTimeout(triggerSweep, msLeft);
    return () => clearTimeout(timer);
  }, [game.turnDeadline, game.status, queryClient, sessionId, game.roomCode]);

  const yours = game.viewerSlot;
  const yourTurn =
    game.currentTurnPlayerId && yours !== null
      ? (yours === 1 ? game.players.one?.id : game.players.two?.id) === game.currentTurnPlayerId
      : false;
  const opponent = yours === 1 ? game.players.two : game.players.one;

  const onPress = useCallback(() => router.push(`/game/${game.roomCode}`), [router, game.roomCode]);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      className="w-48"
      style={{
        borderRadius: 8,
        overflow: "hidden",
        ...lipPadding(CARD_LIP, pressed),
      }}
    >
      <Lip depth={palette.depthSurface} />
      <View className="border border-surfaceHairline bg-surface p-3.5" style={{ borderRadius: 8 }}>
        <View className="gap-0.5">
          <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
            <Text className="text-xs font-normal text-mutedForeground">vs </Text>
            {opponent?.name ?? "?"}
          </Text>
          <Text className="text-[0.7rem] font-semibold tracking-wide text-mutedForeground">
            #{game.roomCode}
          </Text>
        </View>

        <View className="mt-2 flex-row items-baseline">
          <Text className="font-display text-2xl font-semibold text-p1">{game.scores[1]}</Text>
          <Text className="mx-1 text-xl font-medium text-mutedForeground">:</Text>
          <Text className="font-display text-2xl font-semibold text-p2">{game.scores[2]}</Text>
        </View>

        <View className="mt-3 flex-row items-center justify-between">
          <Text
            className={
              yourTurn
                ? "text-[0.65rem] font-bold tracking-wide text-sun"
                : "text-[0.65rem] font-bold tracking-wide text-mutedForeground"
            }
          >
            {yourTurn ? "Your turn" : "Their turn"}
          </Text>
          {game.status === "active" && game.turnDeadline && (
            <Text className="text-[0.65rem] font-semibold tabular-nums text-mutedForeground">
              {timeLeftLabel(game.turnDeadline)}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}
