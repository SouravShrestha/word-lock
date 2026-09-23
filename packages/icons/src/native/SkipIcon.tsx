import Svg, { Path } from "react-native-svg";

import { DEFAULT_ICON_SIZE, type IconProps } from "../types";

export function SkipIcon({ size = DEFAULT_ICON_SIZE, color = "currentColor" }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 18 16"
      fill="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path
        d="M0.00021791 15.0344V0.872929C0.00021791 0.123186 0.884139 -0.276299 1.44699 0.21881L7.96248 5.95188V0.872929C7.96248 0.123186 8.84661 -0.276299 9.40947 0.21881L17.6778 7.49406C17.7722 7.57714 17.8475 7.67967 17.8985 7.7946C17.9495 7.90954 17.9751 8.03416 17.9734 8.15991C17.9717 8.28566 17.9428 8.40954 17.8887 8.52306C17.8346 8.63658 17.7565 8.73704 17.6599 8.81754L9.39139 15.7038C8.82396 16.1764 7.96248 15.7728 7.96248 15.0344V10.2624L1.42891 15.7038C0.861485 16.1764 0 15.7728 0 15.0344"
        fill={color}
      />
    </Svg>
  );
}
