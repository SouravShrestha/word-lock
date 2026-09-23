import { radius } from "@word-lock/tokens/native";
import { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import type { ReactNode } from "react";

const POP_DURATION_MS = 320;
const POP_OVERSHOOT_MS = POP_DURATION_MS * 0.6;
const POP_SETTLE_MS = POP_DURATION_MS - POP_OVERSHOOT_MS;
const POP_EASING = Easing.bezier(0.34, 1.56, 0.64, 1);

export function NavBubble({ focused, children }: { focused: boolean; children: ReactNode }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!focused) {
      scale.value = 1;
      opacity.value = 1;
      return;
    }

    scale.value = withSequence(
      withTiming(0.4, { duration: 0 }),
      withTiming(1.12, { duration: POP_OVERSHOOT_MS, easing: POP_EASING }),
      withTiming(1, { duration: POP_SETTLE_MS, easing: POP_EASING }),
    );
    opacity.value = withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(1, { duration: POP_OVERSHOOT_MS, easing: Easing.linear }),
    );
  }, [focused, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

const FADE_DURATION_MS = 150;
const FADE_EASING = Easing.bezier(0.4, 0, 0.2, 1);

export function NavBubbleOutline({ focused, color }: { focused: boolean; color: string }) {
  const opacity = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    opacity.value = withTiming(focused ? 1 : 0, {
      duration: FADE_DURATION_MS,
      easing: FADE_EASING,
    });
  }, [focused, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        animatedStyle,
        {
          position: "absolute",
          inset: 0,
          borderWidth: 2,
          borderColor: color,
          borderRadius: radius.sm,
        },
      ]}
    />
  );
}
