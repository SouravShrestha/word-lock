import { Text, View } from "react-native";
import { CrossIcon } from "@word-lock/icons/native";
import { REACTION_EMOJIS, type ReactionEmoji } from "@word-lock/core/game";

import { BottomSheet, SheetTouchable } from "@/components/BottomSheet";
import { IconButton } from "@/components/IconButton";

export function EmojiReactionSheet({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (emoji: ReactionEmoji) => void;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} label="Send a reaction">
      <View className="flex-row items-center justify-between gap-4">
        <Text className="font-display text-lg text-foreground">Send a reaction</Text>
        <IconButton variant="danger" size={32} accessibilityLabel="Close" onPress={onClose}>
          <CrossIcon size={14} color="#ffffff" />
        </IconButton>
      </View>

      <View className="mt-6 flex-row flex-wrap gap-3">
        {REACTION_EMOJIS.map((emoji) => (
          <SheetTouchable
            key={emoji}
            accessibilityRole="button"
            accessibilityLabel={`React with ${emoji}`}
            onPress={() => onSelect(emoji)}
            activeOpacity={0.6}
            className="aspect-square items-center justify-center"
            style={{ width: "14%" }}
          >
            <Text style={{ fontSize: 28 }}>{emoji}</Text>
          </SheetTouchable>
        ))}
      </View>
    </BottomSheet>
  );
}
