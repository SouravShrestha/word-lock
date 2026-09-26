import type { SVGProps } from "react";

/**
 * Google's brand mark. Uses the official four colours rather than
 * `currentColor`, since Google's branding guidelines require the logo be shown
 * unmodified on sign-in buttons.
 */
export function GoogleIcon(props: SVGProps<SVGSVGElement>) {
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
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3.01h3.88c2.27-2.09 3.58-5.17 3.58-8.82Z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.88-3.01c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.96H1.29v3.12A11.995 11.995 0 0 0 12 24Z"
        fill="#34A853"
      />
      <path
        d="M5.28 14.27a7.19 7.19 0 0 1-.38-2.27c0-.79.14-1.56.38-2.27V6.61H1.29A11.995 11.995 0 0 0 0 12c0 1.94.46 3.77 1.29 5.39l3.99-3.12Z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.69 1.29 6.61l3.99 3.12C6.22 6.88 8.87 4.77 12 4.77Z"
        fill="#EA4335"
      />
    </svg>
  );
}
