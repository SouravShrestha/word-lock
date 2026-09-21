import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & {
  color?: string;
};

export function PlayIcon({ color = "currentColor", ...props }: Props) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 163.861 163.861"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M34.857 3.613C20.084-4.861 8.107 2.081 8.107 19.106v125.637c0 17.042 11.977 23.975 26.75 15.509L144.67 97.275c14.778-8.477 14.778-22.211 0-30.686z"
        fill={color}
      />
    </svg>
  );
}
