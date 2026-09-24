import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function TopLoader() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const isLoading = isFetching > 0 || isMutating > 0;

  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isLoading) {
      opacity.value = withTiming(1, { duration: 200 });
      progress.value = withTiming(0.9, {
        duration: 5000,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      if (opacity.value > 0) {
        progress.value = withTiming(1, { duration: 200 }, () => {
          opacity.value = withTiming(0, { duration: 200 }, () => {
            progress.value = 0;
          });
        });
      }
    }
  }, [isLoading, opacity, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
      opacity: opacity.value,
    };
  });

  return (
    <View
      style={[StyleSheet.absoluteFill, { height: 4, top: insets.top, zIndex: 9999 }]}
      pointerEvents="none"
    >
      <Animated.View className="h-full bg-sun" style={animatedStyle} />
    </View>
  );
}
