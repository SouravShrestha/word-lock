import { useCallback, useState, type ReactNode } from "react";
import { View, type TouchableOpacityProps } from "react-native";
import { colors } from "@word-lock/tokens/native";

import { SheetTouchable } from "@/components/BottomSheet";
import { Lip, lipPadding } from "@/components/lip";
import { useDebouncePress } from "@/hooks/useDebouncePress";
import { useTheme } from "@/theme/ThemeProvider";

export type IconButtonVariant = "danger" | "surface";

const FILL_KEY = {
  danger: "destructive",
  surface: "surface",
} as const;

const DEPTH_KEY = {
  danger: "depthDanger",
  surface: "depthSurface",
} as const;

const LIP = 3;

export function IconButton({
  variant = "surface",
  size = 36,
  radius = 10,
  disabled = false,
  onPress,
  children,
  className,
  ...pressableProps
}: {
  variant?: IconButtonVariant;
  size?: number;
  radius?: number;
  disabled?: boolean;
  onPress?: () => void;
  children?: ReactNode;
  className?: string;
} & Omit<TouchableOpacityProps, "onPress" | "disabled" | "children" | "style">) {
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];
  const [pressed, setPressed] = useState(false);
  const debouncedPress = useDebouncePress(onPress);

  const fill = palette[FILL_KEY[variant]];
  const depth = palette[DEPTH_KEY[variant]];

  const onPressIn = useCallback(() => setPressed(true), []);
  const onPressOut = useCallback(() => setPressed(false), []);

  const sink = pressed && !disabled;

  return (
    <SheetTouchable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={debouncedPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
      className={className}
      {...pressableProps}
      style={{
        opacity: disabled ? 0.45 : 1,
        width: size,
        height: size + LIP,
        alignSelf: "flex-start",
        borderRadius: radius,
        overflow: "hidden",
        ...lipPadding(LIP, sink),
      }}
    >
      <Lip depth={depth} />
      <View
        className="items-center justify-center border-surfaceHairline border"
        style={{ width: size, height: size, backgroundColor: fill, borderRadius: radius }}
      >
        {children}
      </View>
    </SheetTouchable>
  );
}
