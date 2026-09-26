"use client";

import NextTopLoader from "nextjs-toploader";

export function TopLoader() {
  return (
    <NextTopLoader
      color="var(--sun)"
      initialPosition={0.08}
      crawlSpeed={200}
      height={4}
      crawl
      showSpinner={false}
      easing="ease"
      speed={200}
      shadow="0 0 10px var(--sun), 0 0 5px var(--sun)"
      zIndex={9999}
    />
  );
}
