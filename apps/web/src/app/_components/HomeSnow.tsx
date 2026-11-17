"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import Snowfall from "react-snowfall";

/* Tracks zoom and display density; the browser fires `resize` when either changes. */
function useDevicePixelRatio() {
  const [dpr, setDpr] = useState(1);
  useEffect(() => {
    const update = () => setDpr(window.devicePixelRatio || 1);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return dpr;
}

/*
 * Home's snow, mounted once in the root layout so it keeps falling across navigation
 * instead of restarting every time home remounts. Off home it is only hidden.
 * ponytail: still animates while hidden (40 flakes); unmount on the game route if that ever shows up in a profile.
 */
export function HomeSnow() {
  const onHome = usePathname() === "/";
  const [flake, setFlake] = useState<HTMLImageElement[]>([]);
  const dpr = useDevicePixelRatio();
  const light = useTheme().resolvedTheme === "light";

  // Snowfall draws the image on a canvas, so it has to be loaded first (client only).
  // The light variant is darker: the default's pale #CDE9F7 washes out on a light background.
  useEffect(() => {
    const img = new Image();
    img.onload = () => setFlake([img]);
    img.src = light ? "/christmas/snowflake-light.svg" : "/christmas/snowflake.svg";
    return () => {
      img.onload = null;
    };
  }, [light]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 top-0 -z-[5] h-[100dvh] overflow-hidden ${onHome ? "" : "invisible"}`}
    >
      <Snowfall
        // Flakes are scattered over the canvas size at mount; remount once the real dpr
        // has resized it, or they all spawn in the top-left 1/dpr of the screen.
        key={dpr}
        images={flake}
        color="#9ACBF7"
        snowflakeCount={40}
        radius={[8 * dpr, 18 * dpr]}
        rotationSpeed={[-0.4, 0.4]}
        speed={[0.3 * dpr, 1 * dpr]}
        wind={[-0.3 * dpr, 0.5 * dpr]}
        changeFrequency={600}
        // The library sizes its canvas in CSS pixels, which blurs on hi-DPI screens and
        // when the browser is zoomed. Draw at dpr× resolution and shrink it back with CSS.
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: `${100 * dpr}%`,
          height: `${100 * dpr}%`,
          transform: `scale(${1 / dpr})`,
          transformOrigin: "0 0",
        }}
      />
    </div>
  );
}
