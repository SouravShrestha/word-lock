"use client";

import { useId, type SVGProps } from "react";

import { type LeagueId } from "@/lib/account/leagues";

/**
 * The league badge: a winged shield, recoloured per tier.
 *
 * One component rather than five files because the geometry is identical across
 * tiers — only the gradient stops change. Five copies of this path data would be
 * five places to fix a shape.
 *
 * Every gradient id is per-instance, derived from `useId`. Hardcoding them means
 * two badges on the same page register the same ids, and when one unmounts the
 * others' paint references are left dangling — the badge silently renders
 * unfilled until something forces a repaint. A leaderboard shows a hundred of
 * these at once, so this is not a hypothetical.
 */

interface Palette {
  /** The eight feathers flanking the shield. */
  wing: [string, string];
  /** Outer shield body. */
  shell: [string, string];
  /** Inset shield face. */
  face: [string, string];
  /** The disc at the centre. */
  core: [string, string];
}

/**
 * Each tier reads as a metal: bronze warm and dull, silver neutral, gold the
 * original artwork, platinum cool, diamond blue and bright. Ordering by
 * temperature and brightness rather than hue keeps the tiers legible at the
 * small size the pills render them at, where hue alone is hard to tell apart.
 */
const PALETTES: Record<LeagueId, Palette> = {
  bronze: {
    wing: ["#8C4A1E", "#D08A4E"],
    shell: ["#A9603A", "#CE9060"],
    face: ["#7A3F17", "#B06E36"],
    core: ["#E8C3A0", "#FBEEE0"],
  },
  silver: {
    wing: ["#6B7280", "#CBD5E1"],
    shell: ["#8A99A8", "#C7D2DC"],
    face: ["#5B6672", "#A9B6C2"],
    core: ["#DCE3EA", "#F8FAFC"],
  },
  gold: {
    wing: ["#F27A00", "#FCD34F"],
    shell: ["#FFBF00", "#FFDF3D"],
    face: ["#FF8C00", "#FCC000"],
    core: ["#FFE187", "#FFF8E0"],
  },
  platinum: {
    wing: ["#2E7C8A", "#7FD3DE"],
    shell: ["#4C9AA6", "#9BD8E0"],
    face: ["#27636F", "#69B6C2"],
    core: ["#CFEFF3", "#F2FDFF"],
  },
  diamond: {
    wing: ["#1D4ED8", "#7DA8FF"],
    shell: ["#2563EB", "#7AA5FF"],
    face: ["#1E3A8A", "#3B74E0"],
    core: ["#BFD9FF", "#F0F7FF"],
  },
};

/** Text accent matching each badge, for star counts and league labels beside it. */
export const LEAGUE_TEXT_CLASS: Record<LeagueId, string> = {
  bronze: "text-[#C98A55]",
  silver: "text-[#A9B6C2]",
  gold: "text-[#FFBF00]",
  platinum: "text-[#69B6C2]",
  diamond: "text-[#5B8DEF]",
};

/**
 * The feathers. Each carries its own gradient axis, which is what gives the pairs
 * their mirrored shading — so the coordinates travel with the path rather than
 * being shared.
 */
const WINGS: { d: string; axis: [number, number, number, number] }[] = [
  {
    d: "M135.523 58.5957C144.615 49.5039 158.828 47.9453 166.361 47.834C169.367 47.7969 171.557 49.9863 171.52 52.9922C171.371 60.4883 169.85 74.7012 160.758 83.8301C151.666 92.959 137.453 94.4805 129.92 94.5918C126.914 94.6289 124.725 92.4395 124.762 89.4336C124.91 81.9375 126.432 67.6875 135.523 58.5957Z",
    axis: [126.169, 93.1873, 170.063, 49.2783],
  },
  {
    d: "M144.133 76.4824C155.303 70.0625 169.404 72.2891 176.715 74.1074C179.647 74.8496 181.168 77.5215 180.352 80.416C178.273 87.6152 173.078 100.938 161.908 107.357C150.738 113.777 136.637 111.551 129.326 109.732C126.395 108.99 124.873 106.318 125.689 103.424C127.768 96.2246 133 82.9024 144.133 76.4824Z",
    axis: [132.252, 112.303, 168.766, 66.6873],
  },
  {
    d: "M149.106 92.291C161.834 90.2871 174.229 97.4121 180.352 101.717C182.838 103.461 183.32 106.504 181.465 108.916C176.938 114.891 167.326 125.467 154.598 127.471C141.869 129.475 129.475 122.35 123.352 118.045C120.865 116.301 120.383 113.258 122.238 110.846C126.766 104.871 136.377 94.2949 149.106 92.291Z",
    axis: [128.827, 120.391, 180.87, 88.2996],
  },
  {
    d: "M141.609 106.875C153.744 111.18 161.277 123.314 164.617 130.031C165.953 132.74 164.951 135.635 162.205 136.896C155.377 140.014 141.869 144.764 129.734 140.459C117.6 136.154 110.066 123.982 106.726 117.303C105.391 114.594 106.393 111.662 109.139 110.437C115.967 107.283 129.475 102.57 141.609 106.875Z",
    axis: [109.307, 108.063, 158.936, 142.296],
  },
  {
    d: "M54.4765 58.5957C45.3847 49.5039 31.1719 47.9453 23.6386 47.834C20.6328 47.7969 18.4433 49.9863 18.4804 52.9922C18.6289 60.4883 20.1504 74.7012 29.2422 83.8301C38.334 92.959 52.5469 94.4805 60.0801 94.5918C63.0859 94.6289 65.2754 92.4395 65.2383 89.4336C65.0898 81.9375 63.5683 67.6875 54.4765 58.5957Z",
    axis: [63.9773, 93.4506, 20.0837, 49.5417],
  },
  {
    d: "M45.8672 76.4824C34.6972 70.0625 20.5586 72.2891 13.2851 74.1074C10.3535 74.8496 8.83201 77.5215 9.64842 80.416C11.7265 87.6152 16.9219 100.938 28.0918 107.357C39.2617 113.777 53.4004 111.551 60.6738 109.732C63.6054 108.99 65.164 106.318 64.3105 103.424C62.1953 96.2246 57 82.9024 45.8672 76.4824Z",
    axis: [57.7518, 112.297, 21.2379, 66.6818],
  },
  {
    d: "M40.8945 92.291C28.2031 90.2871 15.8086 97.4121 9.64841 101.717C7.16208 103.461 6.67966 106.504 8.53513 108.916C13.0625 114.891 22.6738 125.467 35.4023 127.471C48.1308 129.475 60.5254 122.35 66.6484 118.045C69.1347 116.301 69.5801 113.258 67.7988 110.846C63.2344 104.871 53.623 94.2949 40.8945 92.291Z",
    axis: [61.1749, 120.388, 9.13243, 88.2965],
  },
  {
    d: "M48.3906 106.875C36.2558 111.18 28.7226 123.314 25.3828 130.031C24.0468 132.74 25.0859 135.635 27.832 136.896C34.6601 140.014 48.1679 144.764 60.3027 140.459C72.4374 136.154 79.9707 123.982 83.3105 117.303C84.6464 114.594 83.6445 111.662 80.8613 110.437C74.0332 107.283 60.5253 102.57 48.3906 106.875Z",
    axis: [80.6976, 108.06, 31.0685, 142.292],
  },
];

const SHELL_PATH =
  "M87.9492 29.0566L53.7344 43.084C46.7578 45.9414 42.2305 52.7324 42.2305 60.2656V105.242C42.2305 145.691 77.5215 158.457 90.3984 161.76C93.4414 162.539 96.5957 162.539 99.6387 161.76C112.516 158.457 147.807 145.691 147.807 105.242V60.2656C147.807 52.7324 143.242 45.9414 136.303 43.084L102.051 29.0566C97.5234 27.2012 92.4766 27.2012 87.9492 29.0566Z";

const FACE_PATH =
  "M95 153.039C94.2207 153.039 93.4414 152.928 92.6992 152.742C87.1699 151.332 76.4824 147.807 67.3906 140.273C56.8516 131.516 51.4707 119.715 51.4707 105.242V60.2656C51.4707 56.4805 53.7344 53.1035 57.2227 51.6934L91.4375 37.666C92.5508 37.2207 93.7383 36.9609 94.9629 36.9609C96.1875 36.9609 97.375 37.1836 98.4883 37.666L132.703 51.6934C136.191 53.1406 138.455 56.4805 138.455 60.2656V105.242C138.455 119.752 133.111 131.516 122.535 140.273C113.443 147.807 102.793 151.332 97.2266 152.742C96.5586 152.965 95.7793 153.039 95 153.039Z";

const CORE_PATH =
  "M95 130.254C114.47 130.254 130.254 114.47 130.254 95C130.254 75.5298 114.47 59.7461 95 59.7461C75.5298 59.7461 59.7461 75.5298 59.7461 95C59.7461 114.47 75.5298 130.254 95 130.254Z";

interface LeagueIconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  league: LeagueId;
}

export function LeagueIcon({ league, className, ...props }: LeagueIconProps) {
  // Colons are legal in an id but awkward in selectors, so strip them.
  const uid = useId().replace(/:/g, "");
  const palette = PALETTES[league];

  const gid = (name: string) => `league-${uid}-${name}`;

  return (
    <svg
      viewBox="0 0 190 190"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      {...props}
    >
      {WINGS.map((wing, i) => (
        <path key={i} d={wing.d} fill={`url(#${gid(`wing${i}`)})`} />
      ))}
      <path d={SHELL_PATH} fill={`url(#${gid("shell")})`} />
      <path d={FACE_PATH} fill={`url(#${gid("face")})`} />
      <path d={CORE_PATH} fill={`url(#${gid("core")})`} />

      <defs>
        {WINGS.map((wing, i) => (
          <linearGradient
            key={i}
            id={gid(`wing${i}`)}
            x1={wing.axis[0]}
            y1={wing.axis[1]}
            x2={wing.axis[2]}
            y2={wing.axis[3]}
            gradientUnits="userSpaceOnUse"
          >
            {/*
              The feathers start mid-gradient so the inner half stays the solid
              darker tone and only the outer tip lightens.
            */}
            <stop offset="0.5" stopColor={palette.wing[0]} />
            <stop offset="1" stopColor={palette.wing[1]} />
          </linearGradient>
        ))}

        <linearGradient
          id={gid("shell")}
          x1="94.9963"
          y1="162.328"
          x2="94.9963"
          y2="27.6762"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={palette.shell[0]} />
          <stop offset="1" stopColor={palette.shell[1]} />
        </linearGradient>

        <linearGradient
          id={gid("face")}
          x1="95"
          y1="153.048"
          x2="95"
          y2="36.9554"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={palette.face[0]} />
          <stop offset="1" stopColor={palette.face[1]} />
        </linearGradient>

        <linearGradient
          id={gid("core")}
          x1="95"
          y1="130.256"
          x2="95"
          y2="59.748"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={palette.core[0]} />
          <stop offset="1" stopColor={palette.core[1]} />
        </linearGradient>
      </defs>
    </svg>
  );
}
