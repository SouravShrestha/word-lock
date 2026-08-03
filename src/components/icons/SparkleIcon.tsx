import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & {
  color?: string;
};

export function SparkleIcon({ color = "currentColor", ...props }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      {/* Magic wand body */}
      <line x1="15" y1="9" x2="3" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Wand tip star */}
      <path
        d="M17.5 3 L18.5 6 L21.5 7 L18.5 8 L17.5 11 L16.5 8 L13.5 7 L16.5 6 Z"
        fill={color}
        stroke={color}
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      {/* Small sparkle top right */}
      <path d="M21 2 L21.5 3.5 L23 4 L21.5 4.5 L21 6 L20.5 4.5 L19 4 L20.5 3.5 Z" fill={color} />
      {/* Small sparkle bottom right */}
      <path
        d="M22 12 L22.4 13.2 L23.6 13.6 L22.4 14 L22 15.2 L21.6 14 L20.4 13.6 L21.6 13.2 Z"
        fill={color}
      />
    </svg>
  );
}
