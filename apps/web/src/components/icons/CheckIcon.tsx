import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & {
  color?: string;
};

export function CheckIcon({ color = "currentColor", ...props }: Props) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 2.709 2.709"
      fill="none"
      fillRule="evenodd"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M1.355.17a1.185 1.185 0 1 1 0 2.371 1.185 1.185 0 0 1 0-2.371M1.11 1.74l-.29-.29a.127.127 0 0 1 .18-.18l.204.205.509-.509a.127.127 0 0 1 .18.18l-.6.599a.127.127 0 0 1-.183-.005"
        fill={color}
      />
    </svg>
  );
}
