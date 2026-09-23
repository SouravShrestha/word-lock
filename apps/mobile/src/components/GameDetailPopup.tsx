import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Modal, Pressable, Text, View } from "react-native";

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

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 items-center justify-center bg-background/70 px-4"
        onPress={onClose}
      >
        {isLoading && (
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Text className="font-sans w-full max-w-sm p-5 text-center text-base text-mutedForeground">
              Loading game
            </Text>
          </Pressable>
        )}

        {!!error && (
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-md border-2 border-hairline bg-card p-5"
          >
            <Text className="font-sans text-center text-sm text-destructive">
              {error instanceof Error ? error.message : "Failed to load game"}
            </Text>
          </Pressable>
        )}

        {!isLoading && !error && game && (
          <Pressable onPress={(e) => e.stopPropagation()}>
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
