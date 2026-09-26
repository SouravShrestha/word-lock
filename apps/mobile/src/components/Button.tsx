import { useCallback, useState, type ReactNode } from "react";
import { View, type TouchableOpacityProps } from "react-native";
import { colors } from "@word-lock/tokens/native";

import { SheetTouchable } from "@/components/BottomSheet";
import { Lip, lipPadding } from "@/components/lip";
import { textClass, Text } from "@/components/text";
import { useDebouncePress } from "@/hooks/useDebouncePress";
import { useTheme } from "@/theme/ThemeProvider";

export type ButtonVariant = "sky" | "blush" | "sun" | "mint" | "surface" | "surface2" | "danger";

function paletteFor(resolvedTheme: "light" | "dark") {
  return colors[resolvedTheme];
}

interface ButtonVariantConfig {
  /** Key into the resolved palette for the face fill colour */
  fill: keyof ReturnType<typeof paletteFor>;
  /** Key into the resolved palette for the lip depth colour (undefined → translucent black) */
  depth?: keyof ReturnType<typeof paletteFor>;
  /**
   * Resolved palette key to use for the label colour.
   * Omit for white (#fff) labels; set to a palette key for theme-sensitive colours.
   * When undefined and lightLabel is false, falls back to `palette.foreground`.
   */
  labelColor?: keyof ReturnType<typeof paletteFor>;
  /**
   * When true the label is light (white or labelColor); when false it uses
   * `palette.foreground` (for surface variants on a contrasting fill).
   */
  lightLabel: boolean;
}

const VARIANT_CONFIG: Record<ButtonVariant, ButtonVariantConfig> = {
  sky: { fill: "sky", depth: "depthSky", lightLabel: true },
  blush: { fill: "blush", depth: "depthBlush", lightLabel: true },
  sun: { fill: "sun", depth: "depthSun", lightLabel: true, labelColor: "onAccent" },
  mint: { fill: "mint", depth: "depthMint", lightLabel: true },
  surface: { fill: "surface", depth: "depthSurface", lightLabel: false },
  surface2: { fill: "surface2", depth: "depthSurface2", lightLabel: false },
  danger: { fill: "destructive", depth: "depthDanger", lightLabel: true },
};

interface ButtonSizeConfig {
  /** Tailwind classes applied to the outer face `View` */
  box: string;
  /**
   * TEXT_STYLE_CONFIG variant key for the label text.
   * Drives font-family, size, weight and tracking from the single config table.
   */
  labelVariant: "buttonMd" | "buttonSheet" | "buttonSm";
  /** Lip depth in logical pixels */
  lip: number;
}

const SIZES: Record<string, ButtonSizeConfig> = {
  md: { box: "rounded-lg px-4 py-3.5", labelVariant: "buttonMd", lip: 5 },
  sheet: { box: "rounded-lg px-4 py-3.5", labelVariant: "buttonSheet", lip: 5 },
  sm: { box: "rounded-lg px-4 py-2.5", labelVariant: "buttonSm", lip: 4 },
};

export type ButtonSize = keyof typeof SIZES;

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

  const { fill: fillKey, depth: depthKey, lightLabel, labelColor } = VARIANT_CONFIG[variant];
  const fill = palette[fillKey];
  const depth = depthKey ? palette[depthKey] : "rgba(0,0,0,0.28)";
  const textColor = lightLabel
    ? labelColor
      ? palette[labelColor]
      : "#ffffff"
    : palette.foreground;

  const { box, labelVariant, lip } = SIZES[size];
  const labelCls = textClass(labelVariant);

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
            <Text className={labelCls} style={{ color: textColor }}>
              {loadingText}
            </Text>
          ) : (
            <>
              {icon}
              {typeof children === "string" ? (
                <Text className={labelCls} style={{ color: textColor }}>
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
