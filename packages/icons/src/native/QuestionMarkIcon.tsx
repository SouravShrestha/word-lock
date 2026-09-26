import Svg, { Path } from "react-native-svg";

import { DEFAULT_ICON_SIZE, type IconProps } from "../types";

export function QuestionMarkIcon({ size = DEFAULT_ICON_SIZE, color = "#000000" }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path
        fill={color}
        d="M12 19a1.5 1.5 0 0 1-1.5-1.5c0-1.938 1.352-3.709 3.909-5.118 1.905-1.05 2.891-3.131 2.51-5.301-.352-2.003-1.997-3.648-4-4-1.445-.254-2.865.092-4.001.974a5 5 0 0 0-1.922 3.559 1.5 1.5 0 1 1-2.991-.227 8 8 0 0 1 3.073-5.7C8.89.278 11.149-.275 13.437.126c3.224.566 5.871 3.213 6.437 6.437.597 3.399-1.018 6.794-4.017 8.447-1.476.813-2.357 1.744-2.357 2.49A1.5 1.5 0 0 1 12 19m-1.5 3.5a1.5 1.5 0 1 0 3.001-.001 1.5 1.5 0 0 0-3.001.001"
      />
    </Svg>
  );
}
