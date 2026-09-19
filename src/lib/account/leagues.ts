/**
 * League bands. Pure — safe to import from client components.
 *
 * A league is **derived**, never stored: it is a reading of the current star
 * count, so the two can never disagree. That also means demotion is automatic —
 * fall below a band's floor and you are in the band below, with no separate
 * bookkeeping to keep in step.
 *
 * The bands widen as they climb. Early leagues should turn over in a handful of
 * games so a new player sees movement; the later ones are meant to take a while.
 */

export type LeagueId = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export interface League {
  id: LeagueId;
  name: string;
  /** First star count in the band. */
  minStars: number;
  /** Last star count in the band, or null for the open-ended top league. */
  maxStars: number | null;
}

/** Ascending by star requirement. Index doubles as the tier number. */
export const LEAGUES: readonly League[] = [
  { id: "bronze", name: "Bronze", minStars: 0, maxStars: 399 },
  { id: "silver", name: "Silver", minStars: 400, maxStars: 899 },
  { id: "gold", name: "Gold", minStars: 900, maxStars: 1499 },
  { id: "platinum", name: "Platinum", minStars: 1500, maxStars: 1999 },
  { id: "diamond", name: "Diamond", minStars: 2000, maxStars: null },
] as const;

/** The lowest band, used for anyone with no star count of their own to read. */
export const DEFAULT_LEAGUE = LEAGUES[0];

/**
 * Which band a star count falls in.
 *
 * Searches from the top so the open-ended Diamond band needs no upper-bound
 * check, and clamps to Bronze for anything at or below zero.
 */
export function leagueForStars(stars: number): League {
  for (let i = LEAGUES.length - 1; i > 0; i--) {
    if (stars >= LEAGUES[i].minStars) return LEAGUES[i];
  }
  return LEAGUES[0];
}

/** Tier number, 0 for Bronze through 4 for Diamond. */
export function leagueIndex(stars: number): number {
  return LEAGUES.indexOf(leagueForStars(stars));
}

export function leagueById(id: LeagueId): League {
  return LEAGUES.find((l) => l.id === id) ?? DEFAULT_LEAGUE;
}

/**
 * Whether a star change crossed a band boundary, for the end-of-game callout.
 * Null when the player stayed put, which is the common case.
 */
export function leagueChange(
  starsBefore: number,
  starsAfter: number,
): "promotion" | "demotion" | null {
  const before = leagueIndex(starsBefore);
  const after = leagueIndex(starsAfter);
  if (after > before) return "promotion";
  if (after < before) return "demotion";
  return null;
}

export interface LeagueProgress {
  league: League;
  /** The band above, or null at the top. */
  next: League | null;
  /** Stars still needed to promote. Zero in the top league. */
  starsToNext: number;
  /** How far through the current band, 0–1. Always 1 in the top league. */
  fraction: number;
}

/**
 * Position within the current band, for a progress bar.
 *
 * Diamond reports as complete rather than as an infinite climb: there is no next
 * band, so a fraction of anything else would be measuring against nothing.
 */
export function progressToNext(stars: number): LeagueProgress {
  const league = leagueForStars(stars);
  const index = LEAGUES.indexOf(league);
  const next = index < LEAGUES.length - 1 ? LEAGUES[index + 1] : null;

  if (!next) {
    return { league, next: null, starsToNext: 0, fraction: 1 };
  }

  const span = next.minStars - league.minStars;
  const into = Math.max(0, stars - league.minStars);

  return {
    league,
    next,
    starsToNext: Math.max(0, next.minStars - stars),
    fraction: Math.min(1, into / span),
  };
}
