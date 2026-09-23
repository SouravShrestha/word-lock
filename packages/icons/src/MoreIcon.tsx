import { DEFAULT_ICON_SIZE, type IconProps } from "./types";

export function MoreIcon({ size = DEFAULT_ICON_SIZE, color = "currentColor" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g fill={color}>
        <circle cx={256} cy={42.667} r={42.667} fill={color} />
        <circle cx={256} cy={256} r={42.667} fill={color} />
        <circle cx={256} cy={469.333} r={42.667} fill={color} />
      </g>
    </svg>
  );
}
