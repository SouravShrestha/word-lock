import Svg, { Path } from "react-native-svg";

import { DEFAULT_ICON_SIZE, type IconProps } from "../types";

export function ChevronDownIcon({ size = DEFAULT_ICON_SIZE, color = "currentColor" }: IconProps) {
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
        d="M16.202,8.934c-.529-.168-1.089,.119-1.259,.645-.833,2.578-2.409,3.319-2.941,3.5-.544-.186-2.114-.93-2.945-3.5-.17-.526-.729-.813-1.259-.645-.525,.17-.813,.733-.644,1.259,1.378,4.269,4.535,4.882,4.669,4.907,.059,.01,.117,.016,.177,.016s.118-.005,.177-.016c.134-.024,3.291-.638,4.669-4.907,.17-.525-.118-1.089-.644-1.259Z"
        fill={color}
      />
    </Svg>
  );
}
