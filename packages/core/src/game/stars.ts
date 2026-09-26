export const BASE_STARS = 200;
export const MIN_STARS = 0;

export const BASE_GAIN = 20;
export const BASE_LOSS = 14;

export const SWING = 16;

export const MIN_GAIN = 4;
export const MAX_GAIN = 36;
export const MIN_LOSS = 2;
export const MAX_LOSS = 30;

export type GameScore = 1 | 0.5 | 0;

/** Probability that `stars` beats `opponentStars`, per the logistic Elo curve. */
export function expectedScore(stars: number, opponentStars: number): number {
  return 1 / (1 + 10 ** ((opponentStars - stars) / 400));
}

/**
 * How lopsided the matchup was, from one player's side: +1 when they were a
 * hopeless underdog, 0 when evenly matched, -1 when an overwhelming favourite.
 *
 * Both deltas are expressed in terms of this so the two sides of a game are
 * guaranteed to read the same matchup from opposite ends.
 */
function tilt(stars: number, opponentStars: number): number {
  return (0.5 - expectedScore(stars, opponentStars)) * 2;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function gainFor(t: number): number {
  return clamp(Math.round(BASE_GAIN + SWING * t), MIN_GAIN, MAX_GAIN);
}

/**
 * Stars lost for a defeat, as a negative number.
 *
 * Note the sign flip this needs: an extreme underdog's raw figure comes out
 * positive (`BASE_LOSS - SWING` is negative), which would hand them stars for
 * losing. The clamp on magnitude is what keeps a loss a loss.
 */
function lossFor(t: number): number {
  return -clamp(Math.round(BASE_LOSS - SWING * t), MIN_LOSS, MAX_LOSS);
}

/**
 * Stars for a draw: nothing between equals, and otherwise a nudge toward the
 * underdog, who over-performed by holding the stronger player.
 *
 * `|| 0` normalises the `-0` that `Math.round` can produce when `t` is `0`
 * but carries a negative sign from `tiltB = -tiltA` — a draw between equals
 * should read as `0`, not `-0`.
 */
function drawFor(t: number): number {
  return Math.round((SWING * t) / 2) || 0;
}

export function starDeltas(
  starsA: number,
  starsB: number,
  scoreA: GameScore,
): { deltaA: number; deltaB: number } {
  const tiltA = tilt(starsA, starsB);
  const tiltB = -tiltA;

  if (scoreA === 0.5) {
    return { deltaA: drawFor(tiltA), deltaB: drawFor(tiltB) };
  }

  if (scoreA === 1) {
    return { deltaA: gainFor(tiltA), deltaB: lossFor(tiltB) };
  }

  return { deltaA: lossFor(tiltA), deltaB: gainFor(tiltB) };
}

export function applyDelta(stars: number, delta: number): number {
  return Math.max(MIN_STARS, stars + delta);
}

export function scoreForPlayerA(playerAId: string, winnerId: string | null): GameScore {
  if (winnerId === null) return 0.5;
  return winnerId === playerAId ? 1 : 0;
}
