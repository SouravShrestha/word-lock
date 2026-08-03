import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & {
  color?: string;
};

export function LeftArrowIcon({ color = "currentColor", ...props }: Props) {
  return (
    <svg width="16" height="16" viewBox="0 0 48 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21.6567 2.82837L5.65674 18.8284L21.6567 34.8284" stroke="black" strokeWidth="6" />
      <path d="M5.65674 18.8284H47.6567" stroke="black" strokeWidth="6" />
    </svg>
  );
}
