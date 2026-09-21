import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & {
  color?: string;
};

/**
 * Sad face — downturned mouth, for a lost game.
 */
export function LossFaceIcon({ color = "currentColor", ...props }: Props) {
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
        d="M12 24a12 12 0 1 1 12-12 12.013 12.013 0 0 1-12 12m0-22a10 10 0 1 0 10 10A10.01 10.01 0 0 0 12 2m5.746 15.667a1 1 0 0 0-.08-1.413A9.45 9.45 0 0 0 12 14a9.45 9.45 0 0 0-5.666 2.254 1 1 0 0 0 1.33 1.494A7.5 7.5 0 0 1 12 16a7.5 7.5 0 0 1 4.336 1.748 1 1 0 0 0 1.41-.081M6 10c0 1 .895 1 2 1s2 0 2-1a2 2 0 0 0-4 0m8 0c0 1 .895 1 2 1s2 0 2-1a2 2 0 0 0-4 0"
        fill={color}
      />
    </svg>
  );
}
