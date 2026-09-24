import { useState } from "react";
import { Text, View } from "react-native";
import { ChevronDownIcon, CrossIcon } from "@word-lock/icons/native";
import { colors } from "@word-lock/tokens/native";

import { BottomSheet, SheetTouchable } from "@/components/BottomSheet";
import { HowToPlaySheet } from "@/components/HowToPlaySheet";
import { IconButton } from "@/components/IconButton";
import { Toggle } from "@/components/Toggle";
import { useTheme } from "@/theme/ThemeProvider";

function MenuRow({
  label,
  hint,
  onPress,
  destructive,
}: {
  label: string;
  hint?: string;
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
          <Text className="font-sans mt-0.5 text-xs text-mutedForeground">{hint}</Text>
        ) : null}
      </View>
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
  const [showRules, setShowRules] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <>
      <BottomSheet
        open={open}
        onClose={onClose}
        label="Game menu"
        dismissable={!showRules}
        showHandle={!showRules}
      >
        <View className="flex-row items-center justify-between gap-4">
          <Text className="font-display text-lg text-foreground">Game menu</Text>
          <IconButton variant="danger" size={32} accessibilityLabel="Close" onPress={onClose}>
            <CrossIcon size={14} color="#ffffff" />
          </IconButton>
        </View>

        <View className="mt-6">
          <View className="w-full flex-row items-center gap-3.5 py-4">
            <View className="min-w-0 flex-1">
              <Text className="text-sm font-medium tracking-wide text-foreground">Dark theme</Text>
            </View>
            <Toggle
              label="Dark theme"
              checked={theme === "dark"}
              onChange={(next) => setTheme(next ? "dark" : "light")}
            />
          </View>

          <MenuRow label="How to play" onPress={() => setShowRules(true)} />

          {canForfeit && (
            <MenuRow
              label="Quit game"
              hint="Your opponent wins and you lose stars."
              onPress={() => {
                onClose();
                onForfeit();
              }}
              destructive
            />
          )}
        </View>
      </BottomSheet>

      <HowToPlaySheet open={showRules} onClose={() => setShowRules(false)} />
    </>
  );
}
