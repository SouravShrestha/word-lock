import { useId } from "react";

import { DEFAULT_ICON_SIZE, type IconProps } from "../types";
import { TROPHY_GRADIENTS, TROPHY_PATHS } from "./trophyNavIconData";

export function TrophyNavIcon({ size = DEFAULT_ICON_SIZE }: IconProps) {
  const uid = useId().replace(/:/g, "");
  const g = (n: number) => `ach-${uid}-${n}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {TROPHY_PATHS.map((d, i) => (
        <path key={i} d={d} fill={`url(#${g(i)})`} />
      ))}
      <defs>
        {TROPHY_GRADIENTS.map((grad, i) =>
          grad.kind === "linear" ? (
            <linearGradient
              key={i}
              id={g(i)}
              x1={grad.x1}
              y1={grad.y1}
              x2={grad.x2}
              y2={grad.y2}
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#FED200" />
              <stop offset="1" stopColor="#F59815" />
            </linearGradient>
          ) : (
            <radialGradient
              key={i}
              id={g(i)}
              cx={grad.cx}
              cy={grad.cy}
              r={grad.r}
              gradientUnits="userSpaceOnUse"
              gradientTransform={grad.gradientTransform}
            >
              <stop offset="1" stopColor="#F2F1ED" />
            </radialGradient>
          ),
        )}
      </defs>
    </svg>
  );
}
