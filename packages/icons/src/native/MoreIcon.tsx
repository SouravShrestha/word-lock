import Svg, { Circle, G } from "react-native-svg";

import { DEFAULT_ICON_SIZE, type IconProps } from "../types";

export function MoreIcon({ size = DEFAULT_ICON_SIZE, color = "currentColor" }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <G fill={color}>
        <Circle cx={256} cy={42.667} r={42.667} fill={color} />
        <Circle cx={256} cy={256} r={42.667} fill={color} />
        <Circle cx={256} cy={469.333} r={42.667} fill={color} />
      </G>
    </Svg>
  );
}
