import { Text } from "@/components/text";
import { View, Platform } from "react-native";
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
  const COLUMNS = 5;

  const emojiTextStyle = {
    fontSize: 34,
    lineHeight: 44,
    ...(Platform.OS === "android" ? { fontFamily: "sans-serif" } : null),
  };

  return (
    <BottomSheet open={open} onClose={onClose} label="Send a reaction" scrollable={false}>
      <View className="flex-row items-center justify-between gap-4">
        <Text variant="autoGen9">Send a reaction</Text>
        <IconButton variant="danger" size={32} accessibilityLabel="Close" onPress={onClose}>
          <CrossIcon size={14} color="#ffffff" />
        </IconButton>
      </View>

      <View className="mt-6 flex-row flex-wrap">
        {REACTION_EMOJIS.map((emoji) => (
          <View key={emoji} style={{ width: `${100 / COLUMNS}%` }} className="p-1">
            <SheetTouchable
              accessibilityRole="button"
              accessibilityLabel={`React with ${emoji}`}
              onPress={() => onSelect(emoji)}
              activeOpacity={0.6}
              className="aspect-square items-center justify-center rounded-lg"
            >
              <Text style={emojiTextStyle}>{emoji}</Text>
            </SheetTouchable>
          </View>
        ))}
      </View>
    </BottomSheet>
  );
}
