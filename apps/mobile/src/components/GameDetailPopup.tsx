import { Text } from "@/components/text";
import { useQuery } from "@tanstack/react-query";
import { Modal, Pressable, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { colors } from "@word-lock/tokens/native";

import { useTheme } from "@/theme/ThemeProvider";

import { fetchGameFn } from "@word-lock/client";
import type { RecentGameEntry } from "@word-lock/core/game";

import { GameResultCard } from "@/components/GameResultCard";

/**
 * Native counterpart of `apps/web`'s
 * `app/profile/_components/GameDetailPopup.tsx` — a finished game opened
 * from a history row, reusing `GameResultCard` exactly as the web version
 * reuses its own, down to the "New Game" action starting a fresh lobby
 * rather than replaying this one. That action is handed up (`onNewGame`)
 * rather than opening `NewGameSheet` here: a bottom sheet draws beneath an
 * RN `Modal`, so the popup has to close before the sheet can be seen.
 *
 * This is a full-window modal, so it covers the tab bar as well as the history
 * screen. It shares the quit confirmation's translucent backdrop rather than
 * relying on Android's target-based blur implementation.
 */
export function GameDetailPopup({
  entry,
  sessionId,
  onClose,
  onNewGame,
}: {
  entry: RecentGameEntry;
  sessionId: string;
  onClose: () => void;
  onNewGame: () => void;
}) {
  const {
    data: game,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["game-detail", entry.roomCode],
    queryFn: () => fetchGameFn({ sessionId, roomCode: entry.roomCode }),
  });

  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      {/* Android renders each Modal in its own native root. */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center bg-black/60 px-4">
          <Pressable
            onPress={onClose}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            className="absolute inset-0"
          />

          {isLoading && (
            <View
              className="w-full max-w-sm rounded-sm p-5"
              style={{ backgroundColor: `${palette.surface}e6` }}
            >
              <Text variant="bodyBase" className="py-2 text-center">
                Loading game
              </Text>
            </View>
          )}

          {!!error && (
            <View
              accessibilityRole="none"
              className="w-full max-w-sm rounded-2xl p-5"
              style={{ backgroundColor: palette.surface }}
            >
              <Text variant="body" className="text-center text-destructive">
                {error instanceof Error ? error.message : "Failed to load game"}
              </Text>
            </View>
          )}

          {!isLoading && !error && game && (
            <View className="w-full max-w-sm">
              <GameResultCard
                game={game}
                onExit={onClose}
                action={{
                  label: "New Game",
                  onPress: onNewGame,
                }}
              />
            </View>
          )}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
