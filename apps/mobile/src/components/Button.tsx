import { useCallback, useState, type ReactNode } from "react";
import { Text, View, type TouchableOpacityProps } from "react-native";
import { colors } from "@word-lock/tokens/native";

import { SheetTouchable } from "@/components/BottomSheet";
import { Lip, lipPadding } from "@/components/lip";
import { useDebouncePress } from "@/hooks/useDebouncePress";
import { useTheme } from "@/theme/ThemeProvider";

export type ButtonVariant = "sky" | "blush" | "sun" | "mint" | "surface" | "surface2" | "danger";

const FILL_KEY: Record<ButtonVariant, keyof ReturnType<typeof paletteFor>> = {
  sky: "sky",
  blush: "blush",
  sun: "sun",
  mint: "mint",
  surface: "surface",
  surface2: "surface2",
  danger: "destructive",
};

const DEPTH_KEY: Partial<Record<ButtonVariant, keyof ReturnType<typeof paletteFor>>> = {
  sky: "depthSky",
  blush: "depthBlush",
  sun: "depthSun",
  mint: "depthMint",
  surface: "depthSurface",
  surface2: "depthSurface2",
  danger: "depthDanger",
};

const LIGHT_LABEL_VARIANTS = new Set<ButtonVariant>(["sky", "blush", "mint", "danger"]);

const SIZES = {
  md: { box: "rounded-md px-4 py-3.5", label: "text-base tracking-tight", lip: 5 },
  sheet: { box: "rounded-md px-4 py-3.5", label: "text-[15px] tracking-wide", lip: 5 },
  sm: { box: "rounded-md px-4 py-2.5", label: "text-[13px] tracking-tight", lip: 4 },
} as const;

export type ButtonSize = keyof typeof SIZES;

function paletteFor(resolvedTheme: "light" | "dark") {
  return colors[resolvedTheme];
}

export function Button({
  variant = "surface",
  size = "md",
  disabled = false,
  loading = false,
  loadingText = "Loading",
  onPress,
  children,
  icon,
  className,
  ...pressableProps
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  onPress?: () => void;
  children?: ReactNode;
  icon?: ReactNode;
  className?: string;
} & Omit<TouchableOpacityProps, "onPress" | "disabled" | "children" | "style">) {
  const { resolvedTheme } = useTheme();
  const palette = paletteFor(resolvedTheme);
  const [pressed, setPressed] = useState(false);
  const debouncedPress = useDebouncePress(onPress);

  const fill = palette[FILL_KEY[variant]];
  const depthKey = DEPTH_KEY[variant];
  const depth = depthKey ? palette[depthKey] : "rgba(0,0,0,0.28)";
  const label = variant === "sun" ? palette.onAccent : "#ffffff";
  const textColor =
    LIGHT_LABEL_VARIANTS.has(variant) || variant === "sun" ? label : palette.foreground;

  const { box, label: labelClass, lip } = SIZES[size];

  const onPressIn = useCallback(() => setPressed(true), []);
  const onPressOut = useCallback(() => setPressed(false), []);

  const isSurfaceVariant = variant === "surface";
  const sink = pressed && !disabled;

  return (
    <SheetTouchable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={debouncedPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
      className={`${roundedOf(box)} ${className ?? ""}`}
      {...pressableProps}
      style={{
        opacity: disabled ? 0.45 : 1,
        overflow: "hidden",
        ...lipPadding(lip, sink),
      }}
    >
      <Lip depth={depth} />
      <View
        className={box}
        style={{
          backgroundColor: fill,
          borderWidth: isSurfaceVariant ? 1 : 0,
          borderColor: palette.surfaceHairline,
        }}
      >
        <View className="flex-row items-center justify-center gap-2">
          {loading ? (
            <Text className={`font-display font-bold ${labelClass}`} style={{ color: textColor }}>
              {loadingText}
            </Text>
          ) : (
            <>
              {icon}
              {typeof children === "string" ? (
                <Text
                  className={`font-display font-bold ${labelClass}`}
                  style={{ color: textColor }}
                >
                  {children}
                </Text>
              ) : (
                children
              )}
            </>
          )}
        </View>
      </View>
    </SheetTouchable>
  );
}

function roundedOf(box: string): string {
  return box.split(" ").find((cls) => cls.startsWith("rounded")) ?? "";
}
