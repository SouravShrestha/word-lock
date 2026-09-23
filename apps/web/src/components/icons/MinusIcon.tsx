import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & {
  color?: string;
};

export function MinusIcon({ color = "currentColor", ...props }: Props) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path d="M16.5,13.5h-9a1.5,1.5,0,0,1,0-3h9a1.5,1.5,0,0,1,0,3Z" fill={color} />
    </svg>
  );
}
