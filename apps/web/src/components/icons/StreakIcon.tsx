"use client";

import { useId, type SVGProps } from "react";

/**
 * Gradient and clip-path ids are per-instance. Hardcoding them means two copies
 * of this icon on the page register the same id, and when one unmounts the
 * other's paint reference is left dangling — the icon silently renders
 * unfilled until something forces a repaint. `useId` is stable across
 * server/client render, so it costs nothing at hydration.
 */
export function StreakIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  // Colons are legal in an id but awkward in selectors, so strip them.
  const uid = useId().replace(/:/g, "");
  const gradId = `streak-grad-${uid}`;
  const clipId = `streak-clip-${uid}`;

  return (
    <svg
      viewBox="0 0 17 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      {...props}
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12.5266 10.9872C12.3869 14.3244 9.63826 16.9874 6.26666 16.9874C2.80567 16.9874 -1.32302e-06 14.0874 -1.32302e-06 10.7207C-1.32302e-06 10.2707 -0.00806802 9.37138 0.666665 7.85404C1.07047 6.94598 1.32373 6.37551 1.46667 5.85404C1.5452 5.56744 1.69793 5.11211 2.13333 5.85404C2.39007 6.29151 2.4 6.92071 2.4 6.92071C2.4 6.92071 3.3552 6.18771 4 4.78738C4.94526 2.73451 4.19106 1.50738 3.93333 0.654044C3.84413 0.358844 3.78813 -0.171689 4.4 0.0540441C5.02347 0.284111 6.67173 1.43791 7.53333 2.65404C8.763 4.38971 9.2 6.05404 9.2 6.05404C9.2 6.05404 9.59373 5.56538 9.73333 5.05404C9.891 4.47664 9.89333 3.90478 10.3999 4.52078C10.8817 5.10658 11.5973 6.20744 12 7.25404C12.7313 9.15464 12.5266 10.9872 12.5266 10.9872Z"
          fill={`url(#${gradId})`}
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M6.26667 16.9875C3.8734 16.9875 1.93333 15.0474 1.93333 12.6541C1.93333 11.2101 2.51527 10.3333 3.7264 9.1444C4.50187 8.38314 5.22767 7.44814 5.53613 6.81147C5.59687 6.68614 5.73507 6.033 6.26793 6.79774C6.54747 7.1988 6.98567 7.91207 7.26667 8.5208C7.75107 9.57034 7.86667 10.5875 7.86667 10.5875C7.86667 10.5875 8.3414 10.3077 8.66667 9.58747C8.77153 9.35534 8.98354 8.47654 9.5762 9.3552C10.0111 10 10.6085 11.1593 10.6 12.6541C10.6 15.0474 8.65987 16.9875 6.26667 16.9875Z"
          fill="#FC9502"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M6.33333 12.2541C6.95 12.2541 6.95 13.3961 7.73333 14.9208C8.25493 15.9361 7.47473 16.9875 6.33333 16.9875C5.19193 16.9875 4.6 16.0622 4.6 14.9208C4.6 13.7795 5.71667 12.2541 6.33333 12.2541Z"
          fill="#FCE202"
        />
      </g>
      <defs>
        <linearGradient
          id={gradId}
          x1="6.27607"
          y1="16.9999"
          x2="6.27607"
          y2="0.012444"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF4C0D" />
          <stop offset="1" stopColor="#FC9502" />
        </linearGradient>
        <clipPath id={clipId}>
          <rect width="17" height="17" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
