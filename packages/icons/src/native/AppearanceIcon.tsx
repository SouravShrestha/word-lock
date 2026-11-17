import Svg, { Path } from "react-native-svg";

import { DEFAULT_ICON_SIZE, type IconProps } from "../types";

export function AppearanceIcon({ size = DEFAULT_ICON_SIZE, color = "currentColor" }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path
        d="M10 .59a9.41 9.41 0 1 0 0 18.82 9.41 9.41 0 0 0 0-18.82Z"
        stroke={color}
        strokeWidth={1.17}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M10 1a9 9 0 0 1 0 18Z" fill={color} />
    </Svg>
  );
}
