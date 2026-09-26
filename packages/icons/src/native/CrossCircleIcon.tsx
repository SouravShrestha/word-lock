import Svg, { Path } from "react-native-svg";

import { DEFAULT_ICON_SIZE, type IconProps } from "../types";

export function CrossCircleIcon({ size = DEFAULT_ICON_SIZE, color = "currentColor" }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      fillRule="evenodd"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path
        d="M12 1.5a10.5 10.5 0 1 0 0 21 10.5 10.5 0 0 0 0-21m3.55 12.43a1.15 1.15 0 0 1-1.62 1.62L12 13.62l-1.93 1.93a1.15 1.15 0 0 1-1.62-1.62L10.38 12 8.45 10.07a1.15 1.15 0 0 1 1.62-1.62L12 10.38l1.93-1.93a1.15 1.15 0 0 1 1.62 1.62L13.62 12z"
        fill={color}
      />
    </Svg>
  );
}
