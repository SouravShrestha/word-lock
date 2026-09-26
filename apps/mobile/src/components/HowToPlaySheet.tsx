import { Text } from "@/components/text";
import { RULES } from "@word-lock/core/game";
import { CrossIcon } from "@word-lock/icons/native";
import { View } from "react-native";

import { BottomSheet } from "@/components/BottomSheet";
import { IconButton } from "@/components/IconButton";
import { RuleNumber } from "@/components/RuleNumber";

/**
 * Native counterpart of `apps/web`'s `HowToPlaySheet.tsx` — the rules, as a
 * controlled sheet, split out from any one trigger so both the home screen
 * and (once ported) Settings can open the same content. `RULES` comes from
 * `@word-lock/core/game`, the single copy shared with the public
 * `/how-to-play` route on both platforms.
 */
export function HowToPlaySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <BottomSheet open={open} onClose={onClose} label="How to play" scrollable={false}>
      <View className="flex-row items-center justify-between gap-4">
        <Text variant="sheetTitle">How to play</Text>
        <IconButton variant="danger" size={32} accessibilityLabel="Close" onPress={onClose}>
          <CrossIcon size={14} color="#ffffff" />
        </IconButton>
      </View>

      <View className="mt-10 gap-4">
        {RULES.map((rule, i) => (
          <View key={rule.title} className="flex-row gap-3">
            <RuleNumber>{i + 1}</RuleNumber>
            <View className="flex-1">
              <Text variant="body" className="font-bold text-foreground">
                {rule.title}
              </Text>
              <Text variant="body" className="mt-1 leading-relaxed">
                {rule.body}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </BottomSheet>
  );
}
