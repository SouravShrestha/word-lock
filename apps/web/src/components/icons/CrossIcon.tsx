import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & {
  color?: string;
};

export function CrossIcon({ color = "currentColor", ...props }: Props) {
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
        d="M22.706 1.731a1.504 1.504 0 0 0-2.056-.521c-.197.118-4.323 2.597-8.65 6.738-4.327-4.141-8.453-6.62-8.65-6.737a1.5 1.5 0 0 0-1.535 2.578c.045.027 3.993 2.398 8.082 6.302C5.206 15.183 2.338 20.568 2.216 20.8a1.499 1.499 0 1 0 2.652 1.4c.028-.053 2.761-5.185 7.132-9.964 4.359 4.767 7.104 9.912 7.132 9.965a1.5 1.5 0 0 0 2.652-1.401c-.122-.232-2.99-5.617-7.681-10.709 4.08-3.893 8.038-6.276 8.083-6.303a1.5 1.5 0 0 0 .52-2.057"
        fill={color}
      />
    </svg>
  );
}
