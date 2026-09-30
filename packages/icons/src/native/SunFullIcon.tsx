import Svg, { Circle, G, Path } from "react-native-svg";

import { DEFAULT_ICON_SIZE, type IconProps } from "../types";

export function SunFullIcon({ size = DEFAULT_ICON_SIZE }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      accessibilityElementsHidden={true}
      importantForAccessibility="no-hide-descendants"
    >
      <G fillRule="evenodd" clipRule="evenodd">
        <Path
          fill="#ffb632"
          d="M86.295 86.295c9.815 30.925 9.188 65.349-4.2 97.671S44.808 241.073 16 256c28.808 14.927 52.706 39.712 66.094 72.034s14.015 66.746 4.2 97.671c30.925-9.815 65.349-9.188 97.671 4.2C216.289 443.294 241.073 467.192 256 496c14.928-28.808 39.712-52.706 72.034-66.094s66.746-14.016 97.671-4.201c-9.815-30.925-9.188-65.349 4.2-97.671S467.192 270.927 496 256c-28.808-14.928-52.706-39.712-66.094-72.034s-14.016-66.746-4.201-97.671c-30.925 9.814-65.349 9.188-97.671-4.2S270.928 44.808 256 16c-14.928 28.808-39.712 52.705-72.034 66.094s-66.746 14.015-97.671 4.201"
        />
        <Circle
          cx="256"
          cy="256"
          r="126.535"
          fill="#ffd33a"
          transform="rotate(-45 255.972 256.066)"
        />
      </G>
    </Svg>
  );
}
