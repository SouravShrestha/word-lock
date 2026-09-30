import Svg, { Path } from "react-native-svg";

import { DEFAULT_ICON_SIZE, type IconProps } from "../types";

export function LightningIcon({ size = DEFAULT_ICON_SIZE }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      accessibilityElementsHidden={true}
      importantForAccessibility="no-hide-descendants"
    >
      <Path
        fill="#ffc166"
        d="m26.76 15.66-13 15A1 1 0 0 1 13 31a1.1 1.1 0 0 1-.39-.08 1 1 0 0 1-.61-1l.07-.76.84-9.16H6a1 1 0 0 1-1-1.28l5-17A1 1 0 0 1 11 1h12a1 1 0 0 1 .84.46 1 1 0 0 1 .07 1L18.56 14H26a1 1 0 0 1 .91.58 1 1 0 0 1-.15 1.08"
      />
      <Path
        fill="#ffd64f"
        d="M23.76 15.66 12.07 29.15l.84-9.15H6a1 1 0 0 1-1-1.28l5-17A1 1 0 0 1 11 1h9a1 1 0 0 1 .84.46 1 1 0 0 1 .07 1L15.56 14H23a1 1 0 0 1 .91.58 1 1 0 0 1-.15 1.08"
      />
    </Svg>
  );
}
