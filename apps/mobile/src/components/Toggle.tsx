import { Switch } from "react-native";
import { colors } from "@word-lock/tokens/native";

import { useTheme } from "@/theme/ThemeProvider";

export function Toggle({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];

  return (
    <Switch
      accessibilityLabel={label}
      value={checked}
      onValueChange={onChange}
      disabled={disabled}
      trackColor={{ false: palette.surface2, true: palette.sky }}
      thumbColor="#ffffff"
      ios_backgroundColor={palette.surface2}
      style={{ transform: [{ scale: 0.75 }] }}
    />
  );
}
