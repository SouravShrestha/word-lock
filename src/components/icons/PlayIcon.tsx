import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & {
  color?: string;
};

export function PlayIcon({ color = "currentColor", ...props }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 700" aria-hidden="true" {...props}>
      <g>
        <path
          d="M556.57 290.34 212.32 91.58C166.39 65.07 109 98.21 109 151.24v397.52c0 53 57.41 86.17 103.34 59.66l344.23-198.76c45.93-26.51 45.93-92.81 0-119.32"
          fill={color}
        />
      </g>
    </svg>
  );
}
