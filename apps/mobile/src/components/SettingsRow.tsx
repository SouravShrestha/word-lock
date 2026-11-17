import { Text } from "@/components/text";
import { ChevronDownIcon } from "@word-lock/icons/native";
import { colors } from "@word-lock/tokens/native";
import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { Linking, View } from "react-native";

import { SheetTouchable } from "@/components/BottomSheet";
import { useTheme } from "@/theme/ThemeProvider";

const ROW = "min-h-16 w-full flex-row items-center";

export function SettingsGroup({ children }: { children: ReactNode }) {
  return <View>{children}</View>;
}

function Body({
  icon,
  label,
  hint,
  value,
}: {
  icon?: ReactNode;
  label: string;
  hint?: ReactNode;
  value?: ReactNode;
}) {
  return (
    <>
      {icon ? <View className="w-8">{icon}</View> : null}
      <View className="min-w-0 flex-1">
        <Text variant="bodyBase" className="font-normal">
          {label}
        </Text>
        {hint ? (
          <Text variant="caption" className="mt-0.5">
            {hint}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text variant="body" className="ml-3 max-w-[60%] font-normal" numberOfLines={1}>
          {value}
        </Text>
      ) : null}
    </>
  );
}

export function SettingsRow({
  icon,
  label,
  hint,
  value,
  href,
  onPress,
}: {
  icon?: ReactNode;
  label: string;
  hint?: ReactNode;
  value?: ReactNode;
  href?: string;
  onPress?: () => void;
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
      accessibilityLabel={typeof value === "string" ? `${label}, ${value}` : label}
      onPress={handlePress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
      className={ROW}
      style={{ opacity: pressed ? 0.6 : 1 }}
    >
      <Body icon={icon} label={label} hint={hint} value={value} />
      <View className="ml-2" style={{ transform: [{ rotate: "-90deg" }] }}>
        <ChevronDownIcon size={20} color={palette.mutedForeground} />
      </View>
    </SheetTouchable>
  );
}

export function SettingsInfoRow({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <View className={ROW}>
      <Body icon={icon} label={label} value={value} />
    </View>
  );
}
