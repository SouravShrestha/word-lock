import { DEFAULT_ICON_SIZE, type IconProps } from "./types";

export function CheersIcon({ size = DEFAULT_ICON_SIZE, color = "currentColor" }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
    >
      <path
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 8 L16 28 Q15 34 20 36 L20 48 L14 52"
      />
      <path
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 52 L26 52"
      />
      <path
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 36 Q26 38 28 32 L24 8"
      />
      <path
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M44 8 L48 28 Q49 34 44 36 L44 48 L50 52"
      />
      <path
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M38 52 L50 52"
      />
      <path
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M44 36 Q38 38 36 32 L40 8"
      />
      <circle cx="32" cy="6" r="1.5" fill={color} />
      <circle cx="28" cy="3" r="1" fill={color} />
      <circle cx="36" cy="3" r="1" fill={color} />
    </svg>
  );
}
