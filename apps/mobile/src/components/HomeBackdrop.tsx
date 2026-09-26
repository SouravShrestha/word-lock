import { useId, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Pattern, Rect, Stop } from "react-native-svg";

import { colors } from "@word-lock/tokens/native";
import { useTheme } from "@/theme/ThemeProvider";

export function HomeBackdrop() {
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];
  const [size, setSize] = useState({ width: 0, height: 0 });

  const uid = useId().replace(/:/g, "");
  const dots = `wl-dots-${uid}`;
  const hillBack = `wl-hill-back-${uid}`;
  const hillFront = `wl-hill-front-${uid}`;

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  const hillsHeight = Math.min(256, size.height || 256);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      onLayout={onLayout}
      style={[StyleSheet.absoluteFill, { backgroundColor: palette.background }]}
    >
      {size.width > 0 && size.height > 0 && (
        <>
          <Svg style={StyleSheet.absoluteFill} width={size.width} height={size.height}>
            <Defs>
              <Pattern id={dots} width={64} height={64} patternUnits="userSpaceOnUse">
                <Circle cx={2} cy={2} r={1.5} fill={palette.foreground} />
              </Pattern>
            </Defs>
            <Rect width={size.width} height={size.height} fill={`url(#${dots})`} opacity={0.07} />
          </Svg>

          <Squiggle
            color={palette.foreground}
            style={{ left: 40, top: 64, transform: [{ rotate: "-20deg" }] }}
          />
          <Squiggle
            color={palette.foreground}
            style={{ left: 24, top: Math.min(416, size.height * 0.5) }}
          />
          <Squiggle
            color={palette.foreground}
            flipped
            style={{ right: 56, bottom: Math.min(224, size.height * 0.35) }}
          />
          <Squiggle
            color={palette.foreground}
            style={{ left: 16, bottom: 64, transform: [{ rotate: "6deg" }] }}
          />

          <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: hillsHeight }}>
            <Svg
              width={size.width}
              height={hillsHeight}
              viewBox="0 0 400 260"
              preserveAspectRatio="none"
              fill="none"
            >
              <Defs>
                <LinearGradient
                  id={hillBack}
                  x1="0"
                  y1="150"
                  x2="0"
                  y2="260"
                  gradientUnits="userSpaceOnUse"
                >
                  <Stop stopColor={palette.foreground} stopOpacity={0.05} />
                  <Stop offset="1" stopColor={palette.foreground} stopOpacity={0} />
                </LinearGradient>
                <LinearGradient
                  id={hillFront}
                  x1="0"
                  y1="180"
                  x2="0"
                  y2="260"
                  gradientUnits="userSpaceOnUse"
                >
                  <Stop stopColor={palette.foreground} stopOpacity={0.06} />
                  <Stop offset="1" stopColor={palette.foreground} stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Path
                d="M0 190C60 150 120 210 190 180C260 150 300 200 400 160V260H0V190Z"
                fill={`url(#${hillBack})`}
              />
              <Path
                d="M0 220C80 190 140 240 220 210C300 180 340 220 400 200V260H0V220Z"
                fill={`url(#${hillFront})`}
              />
            </Svg>
          </View>
        </>
      )}
    </View>
  );
}

function Squiggle({
  color,
  flipped = false,
  style,
}: {
  color: string;
  flipped?: boolean;
  style?: object;
}) {
  return (
    <Svg
      width={56}
      height={32}
      style={[{ position: "absolute" }, flipped ? { transform: [{ scaleX: -1 }] } : null, style]}
      viewBox="0 0 60 30"
      fill="none"
    >
      <Path
        d="M2 8C10 22 18 4 26 16C34 26 42 10 50 18"
        stroke={color}
        strokeOpacity={0.08}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray="6 6"
      />
    </Svg>
  );
}
