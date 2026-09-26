import { useEffect } from "react";
import { View, type ViewProps } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const SWEEP_DURATION_MS = 1600;

export function Shimmer({
  className,
  style,
  children,
  ...rest
}: ViewProps & { className?: string }) {
  const translateX = useSharedValue(-1);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(1, { duration: SWEEP_DURATION_MS, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${translateX.value * 100}%` }],
  }));

  return (
    <View className={`overflow-hidden bg-surface2 ${className ?? ""}`} style={style} {...rest}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={[{ position: "absolute", inset: 0 }, animatedStyle]}
      >
        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.35)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}
