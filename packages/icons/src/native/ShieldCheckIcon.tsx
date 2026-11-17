import Svg, { Path } from "react-native-svg";

import { DEFAULT_ICON_SIZE, type IconProps } from "../types";

export function ShieldCheckIcon({ size = DEFAULT_ICON_SIZE, color = "currentColor" }: IconProps) {
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
        d="M10 2 3.5 4.5v5.2c0 4 2.7 6.9 6.5 8.3 3.8-1.4 6.5-4.3 6.5-8.3V4.5Z"
        stroke={color}
        strokeWidth={1.17}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7.2 10.2l2 2 3.8-4"
        stroke={color}
        strokeWidth={1.17}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
