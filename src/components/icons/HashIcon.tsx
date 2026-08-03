import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & {
  color?: string;
};

export function HashIcon({ color = "currentColor", ...props }: Props) {
  return (
    <svg
      width="48"
      height="43"
      viewBox="0 0 48 43"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path d="M40 1.4856L24 41.4856" stroke={color} strokeWidth={5} fill={color} />
      <path d="M24 1.4856L8 41.4856" stroke={color} strokeWidth={5} fill={color} />
      <path d="M0 28.4856H48" stroke={color} strokeWidth={5} fill={color} />
      <path d="M0 14.4856H48" stroke={color} strokeWidth={5} fill={color} />
    </svg>
  );
}
