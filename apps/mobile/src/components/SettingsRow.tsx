import { Text } from "@/components/text";
import { ChevronDownIcon } from "@word-lock/icons/native";
import { colors } from "@word-lock/tokens/native";
import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { Linking, View } from "react-native";

import { SheetTouchable } from "@/components/BottomSheet";
import { useTheme } from "@/theme/ThemeProvider";

const ROW = "flex-row w-full items-center gap-3.5 px-2 py-4";

function Body({
  label,
  hint,
  destructive,
}: {
  label: string;
  hint?: ReactNode;
  destructive?: boolean;
}) {
  return (
    <View className="min-w-0 flex-1">
      <Text
        className={
          destructive
            ? "text-[15px] font-medium tracking-wide text-destructive"
            : "text-[15px] font-medium tracking-wide text-foreground"
        }
      >
        {label}
      </Text>
      {hint ? (
        typeof hint === "string" ? (
          <Text variant="autoGen11" className="mt-0.5">
            {hint}
          </Text>
        ) : (
          hint
        )
      ) : null}
    </View>
  );
}

export function SettingsRow({
  label,
  hint,
  href,
  onPress,
  destructive = false,
}: {
  label: string;
  hint?: ReactNode;
  href?: string;
  onPress?: () => void;
  destructive?: boolean;
}) {
  const handlePress = href ? () => Linking.openURL(href) : onPress;
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];

  const [pressed, setPressed] = useState(false);
  const onPressIn = useCallback(() => setPressed(true), []);
  const onPressOut = useCallback(() => setPressed(false), []);

  return (
    <SheetTouchable
      accessibilityRole="button"
      onPress={handlePress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
      className={ROW}
      style={{ opacity: pressed ? 0.6 : 1 }}
    >
      <View className="flex-1 flex-row items-center justify-between py-1">
        <Body label={label} hint={hint} destructive={destructive} />
        {!destructive && (
          <View style={{ transform: [{ rotate: "-90deg" }] }}>
            <ChevronDownIcon size={20} color={palette.mutedForeground} />
          </View>
        )}
      </View>
    </SheetTouchable>
  );
}

export function SettingsField({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <View className={ROW}>
      <View className="min-w-0 flex-1">
        <Text variant="autoGen21">{label}</Text>
        <Text variant="autoGen22" className="mt-1" numberOfLines={1}>
          {value}
        </Text>
        {hint ? (
          <Text variant="autoGen23" className="mt-0.5">
            {hint}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function SettingsGroup({ children }: { children: ReactNode }) {
  return <View className="flex-col">{children}</View>;
}
