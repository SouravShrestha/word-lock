"use client";

import { useId, type SVGProps } from "react";

export function HomeNavIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  const clipId = `home-nav-clip-${useId().replace(/:/g, "")}`;

  return (
    <svg
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      {...props}
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M4.20234 21.7422H17.7848C18.498 21.7422 19.0738 21.1622 19.0738 20.4489V11.1418H2.91328V20.4489C2.91328 21.1622 3.49336 21.7422 4.20234 21.7422Z"
          fill="#FFB92D"
        />
        <path
          d="M8.58086 21.7422H13.4062V16.7578C13.4062 15.4215 12.3277 14.3387 10.9914 14.3387C9.65937 14.3387 8.57656 15.4215 8.57656 16.7578L8.58086 21.7422Z"
          fill="#E39629"
        />
        <path
          d="M0.382421 9.92151L9.32852 0.958228C10.2609 0.0258057 11.7691 0.0258057 12.7016 0.958228L21.6176 9.89143C22.4383 10.7121 21.8582 12.1172 20.698 12.1172L1.30625 12.1473C0.146093 12.1473 -0.438282 10.7422 0.382421 9.92151Z"
          fill="#FF4A52"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="22" height="22" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
