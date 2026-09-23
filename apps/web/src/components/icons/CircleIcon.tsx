import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & {
  color?: string;
};

export function CircleIcon({ color = "currentColor", ...props }: Props) {
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
      <path
        d="M12,0A12,12,0,1,0,24,12,12.013,12.013,0,0,0,12,0Zm0,21a9,9,0,1,1,9-9A9.01,9.01,0,0,1,12,21Z"
        fill={color}
      />
    </svg>
  );
}
