import { MIN_STARS } from "./stars";
import type { StatsGameInput } from "./stats";

export interface StarPoint {
  t: string;
  stars: number;
}

export type StarRangeId = "7d" | "30d" | "90d" | "1y" | "all";

export interface StarRange {
  id: StarRangeId;
  label: string;
  days: number | null;
}

export const STAR_RANGES: readonly StarRange[] = [
  { id: "7d", label: "7D", days: 7 },
  { id: "30d", label: "30D", days: 30 },
  { id: "90d", label: "90D", days: 90 },
  { id: "1y", label: "1Y", days: 365 },
  { id: "all", label: "ALL", days: null },
];

export const DEFAULT_STAR_RANGE: StarRangeId = "30d";

const DAY_MS = 86_400_000;

export function starHistory(
  playerId: string,
  games: StatsGameInput[],
  currentStars: number,
  now: Date,
): StarPoint[] {
  const readings: { t: string; stars: number; delta: number | null }[] = [];

  for (const game of games) {
    if (game.status !== "completed") continue;
    const isPlayer1 = game.player1_id === playerId;
    const isPlayer2 = game.player2_id === playerId;
    if (!isPlayer1 && !isPlayer2) continue;

    const stars = isPlayer1 ? game.p1_stars_after : game.p2_stars_after;
    if (stars === null) continue;

    readings.push({
      t: game.last_move_at,
      stars,
      delta: isPlayer1 ? game.p1_star_delta : game.p2_star_delta,
    });
  }

  readings.sort((a, b) => a.t.localeCompare(b.t));

  const nowPoint: StarPoint = { t: now.toISOString(), stars: currentStars };
  if (readings.length === 0) return [nowPoint];

  const points: StarPoint[] = [];

  const first = readings[0];
  if (first.delta !== null) {
    // Undoing the delta only recovers the true pre-game total when the result
    // itself was not clamped at the floor. A loss that landed at MIN_STARS may
    // have taken more than `delta` reflects, so `stars - delta` would overstate
    // the baseline — the floor is what the player actually sat at.
    const baseline =
      first.stars <= MIN_STARS ? MIN_STARS : Math.max(MIN_STARS, first.stars - first.delta);
    points.push({
      t: new Date(new Date(first.t).getTime() - 1).toISOString(),
      stars: baseline,
    });
  }

  for (const reading of readings) {
    points.push({ t: reading.t, stars: reading.stars });
  }

  // Skipped when the last game landed at this instant, which only happens in
  // tests — a duplicated x value would draw as a vertical tick at the edge.
  if (nowPoint.t > points[points.length - 1].t) points.push(nowPoint);

  return points;
}

export function sliceRange(points: StarPoint[], range: StarRange, now: Date): StarPoint[] {
  if (range.days === null || points.length === 0) return points;

  const cutoff = new Date(now.getTime() - range.days * DAY_MS);
  const cutoffIso = cutoff.toISOString();

  const inWindow = points.filter((p) => p.t >= cutoffIso);
  if (inWindow.length === points.length) return points;

  const before = points.filter((p) => p.t < cutoffIso);
  const anchor: StarPoint = { t: cutoffIso, stars: before[before.length - 1].stars };

  return [anchor, ...inWindow];
}

export function rangeDelta(points: StarPoint[]): number | null {
  if (points.length < 2) return null;
  return points[points.length - 1].stars - points[0].stars;
}
