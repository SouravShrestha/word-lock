import { Text } from "@/components/text";
import { useState } from "react";
import { View } from "react-native";
import { ChevronDownIcon, CrossIcon } from "@word-lock/icons/native";
import { colors } from "@word-lock/tokens/native";

import { BottomSheet, SheetTouchable } from "@/components/BottomSheet";
import { HowToPlaySheet } from "@/components/HowToPlaySheet";
import { IconButton } from "@/components/IconButton";
import { AppearanceSheet, THEME_LABELS } from "@/components/AppearanceSheet";
import { useTheme } from "@/theme/ThemeProvider";

function MenuRow({
  label,
  hint,
  value,
  onPress,
  destructive,
}: {
  label: string;
  hint?: string;
  value?: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];

  return (
    <SheetTouchable
      accessibilityRole="button"
      onPress={onPress}
      className="w-full flex-row items-center gap-3.5 py-4"
    >
      <View className="min-w-0 flex-1">
        <Text
          className={
            destructive
              ? "text-sm font-medium tracking-wide text-destructive"
              : "text-sm font-medium tracking-wide text-foreground"
          }
        >
          {label}
        </Text>
        {hint ? (
          <Text variant="autoGen11" className="mt-0.5">
            {hint}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text variant="body" className="max-w-[60%] font-normal" numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      <View style={{ transform: [{ rotate: "-90deg" }], opacity: 0.6 }}>
        <ChevronDownIcon size={16} color={palette.foreground} />
      </View>
    </SheetTouchable>
  );
}

export function GameMenuSheet({
  open,
  onClose,
  canForfeit,
  onForfeit,
}: {
  open: boolean;
  onClose: () => void;
  canForfeit: boolean;
  onForfeit: () => void;
}) {
  const [nested, setNested] = useState<"rules" | "appearance" | null>(null);
  const { theme } = useTheme();

  return (
    <>
      <BottomSheet
        open={open}
        onClose={onClose}
        label="Game menu"
        dismissable={!nested}
        showHandle={!nested}
      >
        <View className="flex-row items-center justify-end">
          <IconButton variant="danger" size={32} accessibilityLabel="Close" onPress={onClose}>
            <CrossIcon size={14} color="#ffffff" />
          </IconButton>
        </View>

        <View className="mt-6">
          <MenuRow
            label="Appearance"
            value={THEME_LABELS[theme]}
            onPress={() => setNested("appearance")}
          />
          <MenuRow label="How to play" onPress={() => setNested("rules")} />

          {canForfeit && (
            <MenuRow
              label="Quit game"
              hint="Your opponent wins and you lose medals."
              onPress={() => {
                onClose();
                onForfeit();
              }}
              destructive
            />
          )}
        </View>
      </BottomSheet>

      <HowToPlaySheet open={nested === "rules"} onClose={() => setNested(null)} />
      <AppearanceSheet open={nested === "appearance"} onClose={() => setNested(null)} />
    </>
  );
}
