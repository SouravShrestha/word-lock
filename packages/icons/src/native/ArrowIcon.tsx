import Svg, { Path } from "react-native-svg";

import { DEFAULT_ICON_SIZE, type IconProps } from "../types";

export function ArrowIcon({ size = DEFAULT_ICON_SIZE, color = "currentColor" }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 47 12"
      fill="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path
        d="M28.4826 0.801636C28.4826 3.09902 29.3473 5.39562 34.1008 5.39562H0.508545V6.60431H34.1008C29.3473 6.60431 28.4826 8.9017 28.4826 11.1983C28.4826 8.9017 41.739 5.99957 46.4917 5.99957C41.7382 5.99957 28.4826 3.09902 28.4826 0.801636Z"
        fill={color}
      />
    </Svg>
  );
}
