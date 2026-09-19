/**
 * Star ladder maths. Pure — no I/O, no clock, no database.
 *
 * Stars replaced a plain Elo rating. The reason is the league bands: Elo is
 * mean-preserving, so with everyone starting at the same number the population
 * average never moves and the upper bands would be unreachable by construction.
 * Elo describes a *distribution*; leagues describe a *ladder*. So a win here is
 * worth more than a loss costs, and the population drifts upward over time —
 * climbing is progress, not just a percentile.
 *
 * What survives from Elo is the shape: the logistic expected-score curve still
 * decides how a result is weighted, so beating someone well above you pays more
 * than beating someone below you, continuously rather than in league-sized
 * steps. That matters at band boundaries, where a lookup table keyed on league
 * alone would treat a 400-star player and a 0-star player as interchangeable.
 *
 * Only games between two logged-in accounts move stars. A guest has no durable
 * identity — their session resets when the browser is cleared, so their stars
 * would never mean anything and, worse, an opponent could farm a throwaway
 * guest session. Games involving a guest still count toward the win/loss record
 * and the daily streak; they are simply unranked.
 */

/**
 * Stars every new account starts with. Matches the column default set in
 * migration 008, and sits mid-Bronze so the first league already has room to
 * fall as well as climb.
 */
export const BASE_STARS = 200;

/** Stars never go below this. A losing run flattens to zero, never negative. */
export const MIN_STARS = 0;

/**
 * Stars for beating an evenly matched opponent, and stars lost to one.
 *
 * The gap between them is the ladder's inflation rate: +6 per decided game
 * between equals. That is what carries the population up through the bands, and
 * it is the single knob that sets how long the climb to Diamond takes. Raising
 * both numbers together makes the ladder faster and noisier; widening the gap
 * makes it more generous.
 */
export const BASE_GAIN = 20;
export const BASE_LOSS = 14;

/**
 * How far opponent strength can shift a result from the base amounts.
 *
 * At the extremes — a hopeless underdog or an overwhelming favourite — this is
 * added or subtracted in full, which is what produces the {@link MIN_GAIN} /
 * {@link MAX_GAIN} range.
 */
export const SWING = 16;

/** Bounds on a single result, so no one game can swing a whole league. */
export const MIN_GAIN = 4;
export const MAX_GAIN = 36;
export const MIN_LOSS = 2;
export const MAX_LOSS = 30;

/** Score from one player's point of view. */
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

/** Stars for a win, given how much of an underdog the winner was. */
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
 * Half the swing, because a draw is half a result.
 *
 * `|| 0` normalises the `-0` that `Math.round` can produce when `t` is `0`
 * but carries a negative sign from `tiltB = -tiltA` — a draw between equals
 * should read as `0`, not `-0`.
 */
function drawFor(t: number): number {
  return Math.round((SWING * t) / 2) || 0;
}

/**
 * Star changes for both players after a completed game between two accounts.
 *
 * `scoreA` is player A's result: 1 win, 0.5 draw, 0 loss.
 *
 * Deliberately **not** zero-sum — see the module comment. The winner's gain
 * normally exceeds the loser's loss, and that asymmetry is the ladder.
 */
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

/** Applies a delta with the star floor enforced. */
export function applyDelta(stars: number, delta: number): number {
  return Math.max(MIN_STARS, stars + delta);
}

/** Player A's score given the winner. A null winner is a draw. */
export function scoreForPlayerA(playerAId: string, winnerId: string | null): GameScore {
  if (winnerId === null) return 0.5;
  return winnerId === playerAId ? 1 : 0;
}
