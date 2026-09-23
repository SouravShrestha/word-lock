import { DEFAULT_ICON_SIZE, type IconProps } from "./types";

export function QuitIcon({ size = DEFAULT_ICON_SIZE, color = "currentColor" }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <path
        d="M22.364 6.808a2 2 0 0 0 0 2.828 9 9 0 1 1-12.728 0 2 2 0 0 0-2.828-2.828 13 13 0 1 0 18.384 0 2 2 0 0 0-2.828 0"
        fill={color}
      />
      <path d="M16 15.8a2.01 2.01 0 0 0 2-2V5a2 2 0 0 0-4 0v8.8a2.01 2.01 0 0 0 2 2" fill={color} />
    </svg>
  );
}
