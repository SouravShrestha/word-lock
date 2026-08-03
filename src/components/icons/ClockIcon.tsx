import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & {
  color?: string;
};

export function ClockIcon({ color = "currentColor", ...props }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M12 24C5.383 24 0 18.617 0 12S5.383 0 12 0s12 5.383 12 12-5.383 12-12 12m0-21c-4.962 0-9 4.037-9 9s4.038 9 9 9 9-4.037 9-9-4.037-9-9-9m5 9.5a1.5 1.5 0 0 0-1.5-1.5H13V6.5a1.5 1.5 0 1 0-3 0v6a1.5 1.5 0 0 0 1.5 1.5h4a1.5 1.5 0 0 0 1.5-1.5"
        fill={color}
      />
    </svg>
  );
}
