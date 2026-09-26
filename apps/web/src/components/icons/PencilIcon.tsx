import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & {
  color?: string;
};

/** Edit affordance. Currently the badge on the profile avatar. */
export function PencilIcon({ color = "currentColor", ...props }: Props) {
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
        d="M3 17.46 14.13 6.33l3.54 3.54L6.54 21H3v-3.54ZM15.54 4.92l1.6-1.6a1.5 1.5 0 0 1 2.12 0l1.42 1.42a1.5 1.5 0 0 1 0 2.12l-1.6 1.6-3.54-3.54Z"
        fill={color}
      />
    </svg>
  );
}
