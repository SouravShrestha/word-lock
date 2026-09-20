"use client";

import { useId, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { StarPoint } from "@/lib/game/star-history";

/**
 * The star curve itself. Split from {@link StatisticsCard} so recharts can be
 * loaded on demand rather than shipped in the profile's first payload — it is by
 * far the heaviest thing on this screen, and the deploy target is Workers.
 *
 * Colours are passed as SVG attributes rather than classes because recharts
 * renders its own elements and takes `stroke`/`fill` as props. `var(--sky)`
 * resolves against the active theme, so this still follows the theme rather than
 * hardcoding a hex.
 */
export function StarChart({ points }: { points: StarPoint[] }) {
  // Recharts needs a numeric axis to space points by real elapsed time; ISO
  // strings would be plotted at even intervals and flatten out any gaps.
  const data = useMemo(
    () => points.map((p) => ({ x: new Date(p.t).getTime(), stars: p.stars })),
    [points],
  );

  const domain = useMemo(() => starDomain(points), [points]);

  // The fill is a gradient, so its id has to be unique per instance: a hardcoded
  // one breaks as soon as two charts coexist, and unmounting one leaves the rest
  // pointing at a removed definition.
  const fillId = useId();

  const withYear = useMemo(() => spansYears(data.map((d) => d.x)), [data]);
  const ticks = useMemo(() => timeTicks(data.map((d) => d.x)), [data]);
  const yTicks = useMemo(() => starTicks(domain), [domain]);

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            {/*
              Fades to nothing rather than to the background colour, so the area
              sits on whatever surface the card happens to use.
            */}
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--sky)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--sky)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="var(--hairline)" strokeDasharray="2 4" />
          <XAxis
            dataKey="x"
            type="number"
            domain={["dataMin", "dataMax"]}
            ticks={ticks}
            tickFormatter={(value: number) => formatTick(value, withYear)}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            // Recharts thins out explicit ticks that it thinks collide; the three
            // are already spaced by the full span, so they are all kept.
            interval={0}
            tick={{ fill: "var(--muted-foreground)", fontSize: 9 }}
          />
          <YAxis
            domain={domain}
            ticks={yTicks}
            width={34}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 9 }}
          />
          {/*
            The render-function form rather than an element: recharts types
            `content` as an element carrying its own tooltip props, so a custom
            component passed that way has to restate them.
          */}
          <Tooltip
            content={({ active, payload }) => (
              <StarTooltip point={active ? readPoint(payload) : null} />
            )}
            cursor={{ stroke: "var(--hairline)", strokeWidth: 1 }}
            isAnimationActive={false}
          />
          {/*
            A straight join, not a spline: a monotone curve invents star totals
            between games that the player never held, and with sparse data it
            overshoots past the line's own maximum.
          */}
          <Area
            type="linear"
            dataKey="stars"
            stroke="var(--sky)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={`url(#${fillId})`}
            dot={false}
            activeDot={{
              r: 5,
              fill: "var(--sky)",
              stroke: "var(--background)",
              strokeWidth: 2,
            }}
            // The line is read as a shape, not sampled point by point, and the
            // animation replays on every range switch.
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface ChartPoint {
  x: number;
  stars: number;
}

/**
 * The hovered datum, or null when there is nothing under the cursor.
 *
 * Recharts hands back its own wrapper around the row, typed as `any` on the way
 * in, so this is the one place the shape is asserted.
 */
function readPoint(payload: readonly { payload?: unknown }[] | undefined): ChartPoint | null {
  const row = payload?.[0]?.payload as ChartPoint | undefined;
  return row && typeof row.x === "number" ? row : null;
}

/** Date and total for the hovered reading. */
function StarTooltip({ point }: { point: ChartPoint | null }) {
  if (!point) return null;

  return (
    <div className="rounded-md bg-foreground px-2.5 py-1.5 text-xs text-background shadow-md">
      <span className="tabular-nums">{new Date(point.x).toLocaleDateString()}</span>
      <span>: </span>
      <span className="font-bold tabular-nums">{point.stars}</span>
    </div>
  );
}

/**
 * Three evenly spaced tick positions across the visible span.
 *
 * Recharts' own numeric ticks land on round millisecond values, which read as
 * arbitrary dates, so the positions are spaced by the span instead. The count is
 * fixed: a window shorter than three days repeats the same date rather than
 * thinning the axis, keeping its rhythm the same at every range.
 */
function timeTicks(xs: number[], count = 3): number[] {
  if (xs.length < 2) return xs;

  const first = xs[0];
  const span = xs[xs.length - 1] - first;
  if (span <= 0) return [first];

  // Inset half a step from both edges: a label centred on an axis end is clipped
  // by the container.
  const step = span / count;
  return Array.from({ length: count }, (_, i) => Math.round(first + step * (i + 0.5)));
}

/**
 * Four gridlines spanning the vertical bounds.
 *
 * Explicit rather than recharts' `tickCount`, which treats the count as a hint
 * and drops to two or three whenever it cannot find round numbers in between.
 * The padded bounds are always tens apart — twenty of padding on each side,
 * before the floor at zero — so rounding each position to a whole star can never
 * collapse two of them together.
 */
function starTicks([low, high]: [number, number], count = 4): number[] {
  const step = (high - low) / (count - 1);
  return Array.from({ length: count }, (_, i) => Math.round(low + step * i));
}

/** Whether the span crosses a calendar year, in which case labels need one. */
function spansYears(xs: number[]): boolean {
  if (xs.length < 2) return false;
  return new Date(xs[0]).getFullYear() !== new Date(xs[xs.length - 1]).getFullYear();
}

function formatTick(value: number, withYear: boolean): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

/**
 * Vertical bounds with breathing room, rounded outward to a multiple of ten.
 *
 * Recharts' own `auto` domain pins the extremes to the top and bottom edges,
 * which reads as if the player had hit a ceiling. The minimum span keeps a quiet
 * week from rendering a two-star wobble as a mountain range.
 */
function starDomain(points: StarPoint[]): [number, number] {
  if (points.length === 0) return [0, 100];

  const values = points.map((p) => p.stars);
  const low = Math.min(...values);
  const high = Math.max(...values);

  const pad = Math.max(20, (high - low) * 0.25);

  return [Math.max(0, Math.floor((low - pad) / 10) * 10), Math.ceil((high + pad) / 10) * 10];
}
