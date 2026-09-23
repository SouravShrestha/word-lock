import { useId } from "react";
import Svg, { Defs, LinearGradient, Path, RadialGradient, Stop } from "react-native-svg";

import { DEFAULT_ICON_SIZE, type IconProps } from "../../types";
import { TROPHY_GRADIENTS, TROPHY_PATHS } from "../../nav/trophyNavIconData";

export function TrophyNavIcon({ size = DEFAULT_ICON_SIZE }: IconProps) {
  const uid = useId().replace(/:/g, "");
  const g = (n: number) => `ach-${uid}-${n}`;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 26 26"
      fill="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {TROPHY_PATHS.map((d, i) => (
        <Path key={i} d={d} fill={`url(#${g(i)})`} />
      ))}
      <Defs>
        {TROPHY_GRADIENTS.map((grad, i) =>
          grad.kind === "linear" ? (
            <LinearGradient
              key={i}
              id={g(i)}
              x1={grad.x1}
              y1={grad.y1}
              x2={grad.x2}
              y2={grad.y2}
              gradientUnits="userSpaceOnUse"
            >
              <Stop stopColor="#FED200" />
              <Stop offset="1" stopColor="#F59815" />
            </LinearGradient>
          ) : (
            <RadialGradient
              key={i}
              id={g(i)}
              cx={grad.cx}
              cy={grad.cy}
              r={grad.r}
              gradientUnits="userSpaceOnUse"
              gradientTransform={grad.gradientTransform}
            >
              {[<Stop key="0" offset="1" stopColor="#F2F1ED" />]}
            </RadialGradient>
          ),
        )}
      </Defs>
    </Svg>
  );
}
