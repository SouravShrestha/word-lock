import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Modal, Pressable, Text, View } from "react-native";
import { colors } from "@word-lock/tokens/native";

import { useTheme } from "@/theme/ThemeProvider";
import { BlurView } from "expo-blur";

import { createGameFn, fetchGameFn } from "@word-lock/client";
import type { RecentGameEntry } from "@word-lock/core/game";

import { GameResultCard } from "@/components/GameResultCard";
import { toast } from "@/components/Toast";

/**
 * Native counterpart of `apps/web`'s
 * `app/profile/_components/GameDetailPopup.tsx` — a finished game opened
 * from a history row, reusing `GameResultCard` exactly as the web version
 * reuses its own, down to the "New Game" action creating a fresh lobby
 * rather than replaying this one.
 *
 * Rendered as RN's own `Modal` (`transparent`, `animationType="fade"`)
 * rather than `BottomSheet` — the web version is explicit that this is a
 * centered overlay, not a sheet, and a `Modal` is this platform's closest
 * equivalent to a `fixed inset-0 flex items-center justify-center` div: its
 * own layer, dismissible by backdrop press, with the hardware back button
 * (Android) closing it for free via `onRequestClose` — this platform's
 * Escape-key equivalent.
 */
export function GameDetailPopup({
  entry,
  sessionId,
  onClose,
}: {
  entry: RecentGameEntry;
  sessionId: string;
  onClose: () => void;
}) {
  const router = useRouter();

  const {
    data: game,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["game-detail", entry.roomCode],
    queryFn: () => fetchGameFn({ sessionId, roomCode: entry.roomCode }),
  });

  const newGameMutation = useMutation({
    mutationFn: () => createGameFn({ sessionId }),
    onSuccess: ({ roomCode }: { roomCode: string }) => {
      onClose();
      router.push(`/game/${roomCode}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 items-center justify-center px-4" onPress={onClose}>
        <View className="absolute inset-0">
          <BlurView
            intensity={15}
            tint={resolvedTheme === "dark" ? "dark" : "light"}
            style={{ flex: 1 }}
          />
          <View className="absolute inset-0 bg-background/70" />
        </View>

        {isLoading && (
          <View className="w-full max-w-sm overflow-hidden rounded-sm">
            <BlurView
              intensity={25}
              tint={resolvedTheme === "dark" ? "dark" : "light"}
              className="p-5"
              style={{ backgroundColor: `${palette.surface}80` }}
            >
              <Text className="font-sans text-center text-base text-foreground py-2">
                Loading game
              </Text>
            </BlurView>
          </View>
        )}

        {!!error && (
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl p-5"
            style={{ backgroundColor: palette.surface }}
          >
            <Text className="font-sans text-center text-sm text-destructive">
              {error instanceof Error ? error.message : "Failed to load game"}
            </Text>
          </Pressable>
        )}

        {!isLoading && !error && game && (
          <Pressable className="w-full max-w-sm" onPress={(e) => e.stopPropagation()}>
            <GameResultCard
              game={game}
              onExit={onClose}
              action={{
                label: "New Game",
                onPress: () => newGameMutation.mutate(),
                pending: newGameMutation.isPending,
              }}
            />
          </Pressable>
        )}
      </Pressable>
    </Modal>
  );
}
