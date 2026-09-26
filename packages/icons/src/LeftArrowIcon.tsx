import { DEFAULT_ICON_SIZE, type IconProps } from "./types";

export function LeftArrowIcon({ size = DEFAULT_ICON_SIZE, color = "currentColor" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 38"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M21.6567 2.82837L5.65674 18.8284L21.6567 34.8284" stroke={color} strokeWidth="6" />
      <path d="M5.65674 18.8284H47.6567" stroke={color} strokeWidth="6" />
    </svg>
  );
}
