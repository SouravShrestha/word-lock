import { colors } from "@word-lock/tokens/native";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/theme/ThemeProvider";

export type ToastVariant = "default" | "success" | "error";

interface ToastState {
  id: number;
  message: string;
  variant: ToastVariant;
}

type Listener = (state: ToastState) => void;

let listener: Listener | null = null;
let nextId = 0;

function emit(message: string, variant: ToastVariant) {
  listener?.({ id: ++nextId, message, variant });
}

export const toast = {
  show: (message: string) => emit(message, "default"),
  error: (message: string) => emit(message, "error"),
  success: (message: string) => emit(message, "success"),
};

const VISIBLE_MS = 2800;

export function ToastHost() {
  const [current, setCurrent] = useState<ToastState | null>(null);
  const insets = useSafeAreaInsets();
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-12);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function dismiss() {
    opacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(-12, { duration: 200 });
    setTimeout(() => setCurrent(null), 200);
  }

  useEffect(() => {
    listener = (state) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setCurrent(state);
      opacity.value = withTiming(1, { duration: 180 });
      translateY.value = withTiming(0, { duration: 180 });
      hideTimer.current = setTimeout(dismiss, VISIBLE_MS);
    };
    return () => {
      listener = null;
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `dismiss` and the shared values are stable for this component's lifetime (shared values are ref-like; `dismiss` closes over them but is redefined identically every render), registering the listener once is intended
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!current) return null;

  const background =
    current.variant === "error"
      ? palette.destructive
      : current.variant === "success"
        ? palette.mint
        : palette.foreground;
  const foreground = current.variant === "success" ? "#ffffff" : palette.background;

  return (
    <View
      pointerEvents="none"
      className="absolute inset-x-0 top-0 items-center px-6"
      style={{ paddingTop: Math.max(insets.top, 12) + 8 }}
    >
      <Animated.View
        style={[animatedStyle, { backgroundColor: background, maxWidth: 360 }]}
        className="rounded-xl px-4 py-3"
      >
        <Text
          className="text-center text-sm font-semibold"
          style={{ color: current.variant === "default" ? palette.background : foreground }}
        >
          {current.message}
        </Text>
      </Animated.View>
    </View>
  );
}
