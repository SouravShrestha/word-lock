/**
 * Builds the star curve shown on the profile. Pure — no React, no Supabase, no
 * clock of its own.
 *
 * The curve is drawn from the per-game snapshots (`pN_stars_after`), not by
 * replaying deltas. Replaying is lossy in two ways the snapshot avoids: a loss
 * clamped at {@link MIN_STARS} records more than it actually took, and migration
 * 008 nulled every historical delta, so older accounts could never be replayed
 * back to their current total. A chart whose line does not end on the number
 * printed above it is worse than no chart.
 *
 * Games with no snapshot — unranked, or completed before migration 010 — are
 * absent from the curve while still counting toward the win/loss record.
 */
import { MIN_STARS } from "./stars";
import type { StatsGameInput } from "./stats";

/** One reading of a player's star total, at a moment in time. */
export interface StarPoint {
  /** ISO timestamp. */
  t: string;
  stars: number;
}

export type StarRangeId = "7d" | "30d" | "90d" | "1y" | "all";

export interface StarRange {
  id: StarRangeId;
  label: string;
  /** Length of the window in days. Null means the whole history. */
  days: number | null;
}

export const STAR_RANGES: readonly StarRange[] = [
  { id: "7d", label: "7D", days: 7 },
  { id: "30d", label: "30D", days: 30 },
  { id: "90d", label: "90D", days: 90 },
  { id: "1y", label: "1Y", days: 365 },
  { id: "all", label: "ALL", days: null },
];

/**
 * A month of history: long enough to show a trend, short enough that a handful
 * of games still reads as a shape rather than a spike at the right edge.
 */
export const DEFAULT_STAR_RANGE: StarRangeId = "30d";

const DAY_MS = 86_400_000;

/**
 * The full star curve for a player, oldest first.
 *
 * Three kinds of point end up in the series:
 *
 *  - **A baseline**, one millisecond before the first recorded game. Without it
 *    the chart would open at the total the player already held *after* their
 *    first recorded result, hiding that result's movement. Its value is derived
 *    backwards from that game's own delta rather than assumed to be
 *    `BASE_STARS`, since games predating migration 010 leave no snapshot and the
 *    first one we can see is rarely the first one played.
 *  - **One point per ranked game**, carrying the total the ladder actually held
 *    afterwards.
 *  - **A reading at `now`** for `currentStars`. Normally this repeats the last
 *    game's value and just extends the line to the right edge. When it does not
 *    — unranked play, or history older than the snapshots — it is the honest
 *    end of the curve, and it guarantees the line finishes on the figure shown
 *    beside it.
 *
 * `now` is injected rather than read so this stays testable.
 */
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

/**
 * The part of a curve falling inside a range, with the window's left edge
 * anchored at the value the player held when it opened.
 *
 * The anchor is what makes a window mean "this period" rather than "the games
 * that happened to fall in this period": a 7D view of a quiet week should be a
 * flat line at the current total, not an empty chart.
 */
export function sliceRange(points: StarPoint[], range: StarRange, now: Date): StarPoint[] {
  if (range.days === null || points.length === 0) return points;

  const cutoff = new Date(now.getTime() - range.days * DAY_MS);
  const cutoffIso = cutoff.toISOString();

  const inWindow = points.filter((p) => p.t >= cutoffIso);
  if (inWindow.length === points.length) return points;

  // The last reading before the window opened is the value it opened at.
  const before = points.filter((p) => p.t < cutoffIso);
  const anchor: StarPoint = { t: cutoffIso, stars: before[before.length - 1].stars };

  return [anchor, ...inWindow];
}

/**
 * Net star movement across a slice, or null if there is nothing to compare.
 *
 * Read off the endpoints rather than summed from deltas, so it matches the line
 * the player is looking at even where a delta was clamped.
 */
export function rangeDelta(points: StarPoint[]): number | null {
  if (points.length < 2) return null;
  return points[points.length - 1].stars - points[0].stars;
}
