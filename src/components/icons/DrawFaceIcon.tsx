import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & {
  color?: string;
};

/**
 * Neutral face — flat mouth, for a drawn game.
 */
export function DrawFaceIcon({ color = "currentColor", ...props }: Props) {
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
        d="M12 24a12 12 0 1 1 12-12 12.013 12.013 0 0 1-12 12m0-22a10 10 0 1 0 10 10A10.01 10.01 0 0 0 12 2m5 14a1 1 0 0 0-1-1H8a1 1 0 0 0 0 2h8a1 1 0 0 0 1-1M6 10c0 1 .895 1 2 1s2 0 2-1a2 2 0 0 0-4 0m8 0c0 1 .895 1 2 1s2 0 2-1a2 2 0 0 0-4 0"
        fill={color}
      />
    </svg>
  );
}
