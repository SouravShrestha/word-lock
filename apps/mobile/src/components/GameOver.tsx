import { Text } from "@/components/text";
import { Modal, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { GameResultCard, type ResultGame } from "@/components/GameResultCard";

export function GameOver({
  game,
  onExit,
  onRematch,
  rematchPending,
}: {
  game: ResultGame;
  onExit: () => void;
  onRematch?: () => void;
  rematchPending?: boolean;
}) {
  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      {/* Android Modals are separate native roots; see GameDetailPopup. */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center bg-black/60 px-4">
          <View className="w-full max-w-sm">
            <GameResultCard
              game={game}
              onExit={onExit}
              action={
                onRematch
                  ? { label: "New Game", onPress: onRematch, pending: rematchPending }
                  : null
              }
            />
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
