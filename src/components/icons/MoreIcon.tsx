import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & {
  color?: string;
};

export function MoreIcon({ color = "currentColor", ...props }: Props) {
  return (
    <svg
      width="512"
      height="512"
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <g fill={color}>
        <circle cx={256} cy={42.667} r={42.667} fill={color} />
        <circle cx={256} cy={256} r={42.667} fill={color} />
        <circle cx={256} cy={469.333} r={42.667} fill={color} />
      </g>
    </svg>
  );
}
