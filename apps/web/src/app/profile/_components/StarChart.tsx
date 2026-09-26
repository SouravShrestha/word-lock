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

import type { StarPoint } from "@word-lock/core/game";

export function StarChart({ points }: { points: StarPoint[] }) {
  const data = useMemo(
    () => points.map((p) => ({ x: new Date(p.t).getTime(), stars: p.stars })),
    [points],
  );

  const domain = useMemo(() => starDomain(points), [points]);
  const fillId = useId();

  const withYear = useMemo(() => spansYears(data.map((d) => d.x)), [data]);
  const ticks = useMemo(() => timeTicks(data.map((d) => d.x)), [data]);
  const yTicks = useMemo(() => starTicks(domain), [domain]);

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
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
          <Tooltip
            content={({ active, payload }) => (
              <StarTooltip point={active ? readPoint(payload) : null} />
            )}
            cursor={{ stroke: "var(--hairline)", strokeWidth: 1 }}
            isAnimationActive={false}
          />
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

function readPoint(payload: readonly { payload?: unknown }[] | undefined): ChartPoint | null {
  const row = payload?.[0]?.payload as ChartPoint | undefined;
  return row && typeof row.x === "number" ? row : null;
}

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

function timeTicks(xs: number[], count = 3): number[] {
  if (xs.length < 2) return xs;

  const first = xs[0];
  const span = xs[xs.length - 1] - first;
  if (span <= 0) return [first];

  // Inset half a step from both edges to prevent clipping
  const step = span / count;
  return Array.from({ length: count }, (_, i) => Math.round(first + step * (i + 0.5)));
}

function starTicks([low, high]: [number, number], count = 4): number[] {
  const step = (high - low) / (count - 1);
  return Array.from({ length: count }, (_, i) => Math.round(low + step * i));
}

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

function starDomain(points: StarPoint[]): [number, number] {
  if (points.length === 0) return [0, 100];

  const values = points.map((p) => p.stars);
  const low = Math.min(...values);
  const high = Math.max(...values);

  const pad = Math.max(20, (high - low) * 0.25);

  return [Math.max(0, Math.floor((low - pad) / 10) * 10), Math.ceil((high + pad) / 10) * 10];
}
