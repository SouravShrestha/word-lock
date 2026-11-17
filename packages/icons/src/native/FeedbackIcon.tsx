import Svg, { Path } from "react-native-svg";

import { DEFAULT_ICON_SIZE, type IconProps } from "../types";

export function FeedbackIcon({ size = DEFAULT_ICON_SIZE, color = "currentColor" }: IconProps) {
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
        d="M4.5 2.5h11A2.5 2.5 0 0 1 18 5v7a2.5 2.5 0 0 1-2.5 2.5H9.5l-4 3.2V14.5h-1A2.5 2.5 0 0 1 2 12V5a2.5 2.5 0 0 1 2.5-2.5Z"
        stroke={color}
        strokeWidth={1.17}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 6.8h8M6 10.2h5"
        stroke={color}
        strokeWidth={1.17}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
