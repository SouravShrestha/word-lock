import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & {
  color?: string;
};

export function CopyIcon({ color = "currentColor", ...props }: Props) {
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
        d="m19,0h-6c-2.757,0-5,2.243-5,5v6c0,2.757,2.243,5,5,5h6c2.757,0,5-2.243,5-5v-6c0-2.757-2.243-5-5-5Zm3,11c0,1.654-1.346,3-3,3h-6c-1.654,0-3-1.346-3-3v-6c0-1.654,1.346-3,3-3h6c1.654,0,3,1.346,3,3v6Zm-6,8c0,2.757-2.243,5-5,5h-6c-2.757,0-5-2.243-5-5v-6c0-2.757,2.243-5,5-5,.553,0,1,.448,1,1s-.447,1-1,1c-1.654,0-3,1.346-3,3v6c0,1.654,1.346,3,3,3h6c1.654,0,3-1.346,3-3,0-.552.447-1,1-1s1,.448,1,1Z"
        fill={color}
      />
    </svg>
  );
}
