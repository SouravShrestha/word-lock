"use client";

import { useId } from "react";

import { BOTTOM_NAV_SPACER } from "@/components/BottomNav";

/*
 * Decorative backdrop for the home screen only. Everything here is
 * `aria-hidden`, absolutely positioned behind the real content, and kept at
 * low opacity so it reads as texture rather than competing with the
 * wordmark/buttons — the "minimal" flat look stays intact, this just gives
 * the empty space around it some life.
 */
export function HomeBackdrop() {
  // Per-instance gradient/pattern ids: hardcoded ones break if this ever renders twice.
  const uid = useId();
  const hillBack = `wl-hill-back-${uid}`;
  const hillFront = `wl-hill-front-${uid}`;
  const dots = `wl-dots-${uid}`;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      {/* Faint dot grid across the whole backdrop, sitting under everything
       * else as base texture. */}
      <svg className="absolute inset-0 h-full w-full text-foreground">
        <defs>
          <pattern id={dots} width="64" height="64" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${dots})`} opacity="0.07" />
      </svg>

      {/* Rotated letter tiles floating in the corners, matching the tile-face
       * look used in-game (rounded square, bold centered glyph). */}
      {/* <TileGhost letter="A" className="-left-2 top-24 -rotate-12 text-p2" />
      <TileGhost letter="E" className="-right-2 top-64 rotate-6 text-mint" />
      <TileGhost letter="S" className="right-4 bottom-40 rotate-12 text-p1" /> */}

      {/* Small dashed scribbles scattered around, like hand-drawn accents
       * near the tiles rather than one continuous line. */}
      <Squiggle className="left-10 top-16 rotate-[-20deg]" />
      <Squiggle className="left-6 top-104 rotate-[8deg]" />
      <Squiggle className="right-14 bottom-56 rotate-[-10deg]" flipped />

      {/* Soft rounded hills stacked along the bottom edge, kept clear of the
       * bottom nav's reserved strip so nothing sits under the tab bar. */}
      <div className={`absolute inset-x-0 bottom-0 ${BOTTOM_NAV_SPACER}`}>
        {/*
         * The hill shapes close with a solid block down to the viewBox bottom.
         * Filled flat, that block ends in a hard horizontal line right above
         * the nav and reads as a lighter band next to the nav's solid
         * `bg-background`. Fading each fill out toward the bottom dissolves
         * the wash into the page instead, so only the wave crests show.
         */}
        <svg
          className="h-64 w-full text-foreground"
          viewBox="0 0 400 260"
          preserveAspectRatio="none"
          fill="none"
        >
          <defs>
            <linearGradient
              id={hillBack}
              x1="0"
              y1="150"
              x2="0"
              y2="260"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="currentColor" stopOpacity="0.05" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
            <linearGradient
              id={hillFront}
              x1="0"
              y1="180"
              x2="0"
              y2="260"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="currentColor" stopOpacity="0.06" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 190C60 150 120 210 190 180C260 150 300 200 400 160V260H0V190Z"
            fill={`url(#${hillBack})`}
          />
          <path
            d="M0 220C80 190 140 240 220 210C300 180 340 220 400 200V260H0V220Z"
            fill={`url(#${hillFront})`}
          />
        </svg>

        <Squiggle className="left-4 bottom-16 rotate-6" />
      </div>
    </div>
  );
}

function TileGhost({ letter, className = "" }: { letter: string; className?: string }) {
  return (
    <div
      className={`tile-face absolute h-12 w-12 text-2xl text-current opacity-10 ${className}`}
      style={{ backgroundColor: "currentColor" }}
    >
      <span className="text-background">{letter}</span>
    </div>
  );
}

/*
 * One short hand-drawn dash mark. `flipped` mirrors it horizontally and
 * `arrow` appends a small arrowhead at the end, so scattering a handful of
 * these with different rotations/positions reads as loose scribbles rather
 * than one continuous line repeated.
 */
function Squiggle({
  className = "",
  flipped = false,
  arrow = false,
}: {
  className?: string;
  flipped?: boolean;
  arrow?: boolean;
}) {
  return (
    <svg
      className={`absolute h-8 w-14 text-foreground/8 ${flipped ? "-scale-x-100" : ""} ${className}`}
      viewBox="0 0 60 30"
      fill="none"
    >
      <path
        d="M2 8C10 22 18 4 26 16C34 26 42 10 50 18"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="6 6"
      />
      {arrow && (
        <path
          d="M42 10L50 18L41 21"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
