"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";

import { useAccount } from "@/hooks/use-account";
import {
  DEFAULT_STAR_RANGE,
  rangeDelta,
  sliceRange,
  STAR_RANGES,
  type StarPoint,
  type StarRangeId,
} from "@/lib/game/star-history";
import type { StatsOverview } from "@/lib/game/stats";
import { cn } from "@/lib/utils";

/*
 * Recharts is ~100kB of the profile's payload and nothing above the fold needs
 * it, so it arrives after the rest of the screen. `ssr: false` because the chart
 * measures its container to size itself and has nothing to measure on a server
 * render.
 */
const StarChart = dynamic(() => import("./StarChart").then((m) => m.StarChart), {
  ssr: false,
  loading: () => <div className="h-56 w-full animate-pulse rounded-sm bg-muted" />,
});

/**
 * Where the player's stars have been, and their record.
 *
 * The headline figure is the live total from the account summary rather than the
 * end of the curve. They agree in every ordinary case — the server anchors the
 * curve on that same number — and when they cannot, the authoritative one is the
 * one to print.
 */
export function StatisticsCard({
  starHistory,
  overview,
}: {
  starHistory: StarPoint[];
  overview: StatsOverview;
}) {
  const { data: account } = useAccount();
  const [range, setRange] = useState<StarRangeId>(DEFAULT_STAR_RANGE);

  const selected = STAR_RANGES.find((r) => r.id === range)!;

  /*
   * The last point is the server's reading at the moment it built the curve, so
   * it stands in for "now" when slicing. Using the browser's clock instead would
   * put the window's edge slightly past the data and make the result depend on
   * how long the page had been open.
   */
  const now = useMemo(
    () => (starHistory.length ? new Date(starHistory[starHistory.length - 1].t) : new Date()),
    [starHistory],
  );

  const points = useMemo(
    () => sliceRange(starHistory, selected, now),
    [starHistory, selected, now],
  );
  const delta = rangeDelta(points);
  const stars = account?.stars ?? points[points.length - 1]?.stars ?? 0;

  return (
    <section className="pt-5 pb-16">
      <div className="flex items-baseline justify-between gap-3 px-5">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-4xl font-bold tabular-nums">{stars}</span>
          <TrendLabel delta={delta} />
        </div>
        <span className="text-xs font-semibold text-muted-foreground">
          Peak {account?.peakStars ?? stars}
        </span>
      </div>

      <div
        role="group"
        aria-label="Chart range"
        className="mt-10 flex items-center justify-around gap-4 px-5"
      >
        {STAR_RANGES.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setRange(option.id)}
            aria-pressed={option.id === range}
            className={cn(
              "press rounded-sm px-3 py-1.5 text-xs font-bold tracking-wide transition-colors",
              option.id === range
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-7">
        {/*
          One reading is a dot, not a trend. Saying so is better than drawing a
          flat line that looks like a long stretch of no progress.
        */}
        {points.length > 1 ? (
          <StarChart points={points} />
        ) : (
          <div className="grid h-56 place-items-center px-6 text-center">
            <p className="text-sm text-muted-foreground">
              Play a few ranked games and your star history will show up here.
            </p>
          </div>
        )}
      </div>

      <div className="mt-10 grid grid-cols-4 gap-2 pt-4 text-center">
        <Stat label="Games" value={overview.total} />
        <Stat label="Wins" value={overview.wins} share={share(overview.wins, overview.total)} />
        <Stat label="Draws" value={overview.draws} share={share(overview.draws, overview.total)} />
        <Stat
          label="Losses"
          value={overview.losses}
          share={share(overview.losses, overview.total)}
        />
      </div>
    </section>
  );
}

/**
 * Net movement over the visible window.
 *
 * Nothing is shown when the window holds a single reading: there is no movement
 * to report, and a `0` there would claim the player played and went nowhere.
 */
function TrendLabel({ delta }: { delta: number | null }) {
  if (delta === null) return null;

  if (delta === 0) {
    return <span className="text-sm font-bold text-muted-foreground tabular-nums">no change</span>;
  }

  const up = delta > 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-sm font-bold tabular-nums",
        up ? "text-mint" : "text-p1",
      )}
    >
      <TrendArrow up={up} />
      {Math.abs(delta)}
    </span>
  );
}

/** Plain triangle, no gradient — so no per-instance ids are needed. */
function TrendArrow({ up }: { up: boolean }) {
  return (
    <svg
      viewBox="0 0 10 12"
      className={cn("h-3 w-2.5", up ? "" : "rotate-180")}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M5 0.5 9.5 6H6.2v5.5H3.8V6H0.5z" />
    </svg>
  );
}

function share(part: number, total: number): string | null {
  if (total === 0) return null;
  return `${Math.round((part / total) * 100)}%`;
}

function Stat({ label, value, share }: { label: string; value: number; share?: string | null }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="font-display text-2xl font-bold tabular-nums">{value}</span>
      <span className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
        {label}
        {share && <span className="ml-1 normal-case tabular-nums">{share}</span>}
      </span>
    </div>
  );
}
