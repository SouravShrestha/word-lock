import { AutoThemeIcon, CrossIcon, MoonIcon, SunIcon } from "@word-lock/icons/native";
import { colors } from "@word-lock/tokens/native";
import { useColorScheme, View } from "react-native";

import { BottomSheet, SheetTouchable } from "@/components/BottomSheet";
import { IconButton } from "@/components/IconButton";
import { Text } from "@/components/text";
import { useTheme, type ThemePreference } from "@/theme/ThemeProvider";

export const THEME_LABELS: Record<ThemePreference, string> = {
  system: "System",
  dark: "Dark",
  light: "Light",
};

const OPTIONS = [
  { value: "system", Icon: AutoThemeIcon },
  { value: "dark", Icon: MoonIcon },
  { value: "light", Icon: SunIcon },
] as const;

export function AppearanceSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const device = useColorScheme() === "dark" ? "dark" : "light";
  const palette = colors[resolvedTheme];

  return (
    <BottomSheet open={open} onClose={onClose} label="Appearance" scrollable={false}>
      <View className="flex-row items-center justify-between gap-4 px-1">
        <Text variant="sheetTitle">Choose your theme</Text>
        <IconButton variant="danger" size={32} accessibilityLabel="Close" onPress={onClose}>
          <CrossIcon size={14} color="#ffffff" />
        </IconButton>
      </View>

      <View accessibilityRole="radiogroup" className="mt-6 flex-row gap-3 px-1 pb-6">
        {OPTIONS.map(({ value, Icon }) => {
          const selected = theme === value;
          // The tile previews what it picks; System previews the device's scheme.
          const tile = colors[value === "system" ? device : value];
          return (
            <SheetTouchable
              key={value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={THEME_LABELS[value]}
              onPress={() => {
                setTheme(value);
                onClose();
              }}
              activeOpacity={0.8}
              className="h-28 flex-1 justify-between overflow-hidden rounded-xl border px-3 pb-3 pt-4"
              style={{ backgroundColor: tile.background, borderColor: palette.border }}
            >
              <Icon size={16} color={tile.foreground} />
              <Text className="text-base font-medium" style={{ color: tile.foreground }}>
                {THEME_LABELS[value]}
              </Text>
              {selected ? <View className="absolute inset-x-0 bottom-0 h-1 bg-sky" /> : null}
            </SheetTouchable>
          );
        })}
      </View>
    </BottomSheet>
  );
}
