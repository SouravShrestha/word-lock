import Svg, { Path } from "react-native-svg";

import { DEFAULT_ICON_SIZE, type IconProps } from "../types";

export function PencilIcon({ size = DEFAULT_ICON_SIZE, color = "currentColor" }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path
        d="M3 17.46 14.13 6.33l3.54 3.54L6.54 21H3v-3.54ZM15.54 4.92l1.6-1.6a1.5 1.5 0 0 1 2.12 0l1.42 1.42a1.5 1.5 0 0 1 0 2.12l-1.6 1.6-3.54-3.54Z"
        fill={color}
      />
    </Svg>
  );
}
