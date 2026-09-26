import Svg, { Path } from "react-native-svg";

import { DEFAULT_ICON_SIZE, type IconProps } from "../types";

export function MailIcon({ size = DEFAULT_ICON_SIZE, color = "currentColor" }: IconProps) {
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
        d="M19,3H5C2.243,3,0,5.243,0,8v8c0,2.757,2.243,5,5,5h14c2.757,0,5-2.243,5-5V8c0-2.757-2.243-5-5-5Zm3,13c0,1.654-1.346,3-3,3H5c-1.654,0-3-1.346-3-3V8c0-1.654,1.346-3,3-3h14c1.654,0,3,1.346,3,3v8ZM18.4,8.2c.331.442.242,1.069-.2,1.4l-4.2,3.15c-.591.443-1.295.665-2,.665s-1.409-.222-2-.665l-4.2-3.15c-.442-.331-.531-.958-.2-1.4.332-.442.958-.531,1.4-.2l4.2,3.15c.473.355,1.128.355,1.6,0l4.2-3.15c.442-.331,1.069-.242,1.4.2Z"
        fill={color}
      />
    </Svg>
  );
}
