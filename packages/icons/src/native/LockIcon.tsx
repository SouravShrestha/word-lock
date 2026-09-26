import Svg, { Path, Rect } from "react-native-svg";

import { DEFAULT_ICON_SIZE, type IconProps } from "../types";

export function LockIcon({ size = DEFAULT_ICON_SIZE, color = "currentColor" }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Rect x="4" y="10.5" width="16" height="10.5" rx="2.5" />
      <Path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
      <Path d="M12 14.5v2.5" />
    </Svg>
  );
}
