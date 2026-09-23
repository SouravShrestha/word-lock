import Svg, { Line, Path } from "react-native-svg";

import { DEFAULT_ICON_SIZE, type IconProps } from "../types";

export function SparkleIcon({ size = DEFAULT_ICON_SIZE, color = "currentColor" }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Line x1="15" y1="9" x2="3" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path
        d="M17.5 3 L18.5 6 L21.5 7 L18.5 8 L17.5 11 L16.5 8 L13.5 7 L16.5 6 Z"
        fill={color}
        stroke={color}
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      <Path d="M21 2 L21.5 3.5 L23 4 L21.5 4.5 L21 6 L20.5 4.5 L19 4 L20.5 3.5 Z" fill={color} />
      <Path
        d="M22 12 L22.4 13.2 L23.6 13.6 L22.4 14 L22 15.2 L21.6 14 L20.4 13.6 L21.6 13.2 Z"
        fill={color}
      />
    </Svg>
  );
}
