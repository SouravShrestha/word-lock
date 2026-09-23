import type { SVGProps } from "react";

/**
 * Three stacked bars from `assets/svgs/menu.svg`. Used for the in-game menu
 * trigger in `GameBottomBar`.
 */
export function MenuIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 14 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      {...props}
    >
      <path
        d="M0.550098 1.2H13.3376C13.6126 1.2 13.8188 0.975 13.8188 0.6C13.8188 0.225 13.6126 0 13.2688 0H0.550098C0.275098 0 9.7394e-05 0.225 9.7394e-05 0.6C9.7394e-05 0.975 0.275098 1.2 0.550098 1.2ZM0.550098 6.45H13.3376C13.6126 6.45 13.8188 6.225 13.8188 5.85C13.8188 5.475 13.6126 5.25 13.2688 5.25H0.550098C0.275098 5.25 9.7394e-05 5.475 9.7394e-05 5.85C9.7394e-05 6.225 0.275098 6.45 0.550098 6.45ZM0.550098 11.7H13.3376C13.6126 11.7 13.8188 11.475 13.8188 11.1C13.8188 10.725 13.6126 10.5 13.2688 10.5H0.550098C0.275098 10.5 9.7394e-05 10.725 9.7394e-05 11.1C9.7394e-05 11.475 0.275098 11.7 0.550098 11.7Z"
        fill="currentColor"
      />
    </svg>
  );
}
