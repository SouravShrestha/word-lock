import { useState } from "react";
import { Pressable, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useRouter } from "expo-router";
import { colors } from "@word-lock/tokens/native";

import { Lip, lipPadding } from "@/components/lip";
import { useDebouncePress } from "@/hooks/useDebouncePress";
import { useTheme } from "@/theme/ThemeProvider";

export function BackButton({ onPress, label = "Back" }: { onPress?: () => void; label?: string }) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  const [pressed, setPressed] = useState(false);
  const debouncedPress = useDebouncePress(onPress ?? goBack);
  const LIP = 3;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={debouncedPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={{
        width: 36,
        alignSelf: "flex-start",
        borderRadius: 12,
        overflow: "hidden",
        ...lipPadding(LIP, pressed),
      }}
    >
      <Lip depth={palette.depthSun} />
      <View
        className="h-9 w-9 items-center justify-center"
        style={{ backgroundColor: palette.sun, borderRadius: 12 }}
      >
        <Svg width={16} height={16} viewBox="0 0 48 38" fill="none">
          <Path
            d="M21.6567 2.82837L5.65674 18.8284L21.6567 34.8284"
            stroke={palette.onAccent}
            strokeWidth={6}
          />
          <Path d="M5.65674 18.8284H47.6567" stroke={palette.onAccent} strokeWidth={6} />
        </Svg>
      </View>
    </Pressable>
  );
}
