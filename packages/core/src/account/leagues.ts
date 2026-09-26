export type LeagueId = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export interface League {
  id: LeagueId;
  name: string;
  minStars: number;
  maxStars: number | null;
}

export const LEAGUES: readonly League[] = [
  { id: "bronze", name: "Bronze", minStars: 0, maxStars: 399 },
  { id: "silver", name: "Silver", minStars: 400, maxStars: 899 },
  { id: "gold", name: "Gold", minStars: 900, maxStars: 1499 },
  { id: "platinum", name: "Platinum", minStars: 1500, maxStars: 1999 },
  { id: "diamond", name: "Diamond", minStars: 2000, maxStars: null },
] as const;

export const DEFAULT_LEAGUE = LEAGUES[0];

export function leagueForStars(stars: number): League {
  for (let i = LEAGUES.length - 1; i > 0; i--) {
    if (stars >= LEAGUES[i].minStars) return LEAGUES[i];
  }
  return LEAGUES[0];
}

export function leagueIndex(stars: number): number {
  return LEAGUES.indexOf(leagueForStars(stars));
}

export function leagueById(id: LeagueId): League {
  return LEAGUES.find((l) => l.id === id) ?? DEFAULT_LEAGUE;
}

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
  next: League | null;
  starsToNext: number;
  fraction: number;
}

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
