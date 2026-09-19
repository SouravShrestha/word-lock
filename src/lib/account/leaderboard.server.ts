/**
 * Leaderboard reads. Server-only.
 *
 * Ranking is by stored star count, so this is a plain ordered query rather than
 * anything derived — the query is always scoped to the viewer's own league band
 * via a range predicate.
 *
 * There is no longer a minimum-games gate. Every account with a username is
 * listed from its first visit: with a star ladder the early bands are supposed to
 * be busy, and a newcomer sitting mid-Bronze is an honest reading of where they
 * are rather than the misleadingly-high provisional rating the gate existed to
 * hide.
 */
import { getSupabaseAdmin } from "@/integrations/supabase/client.server";
import { LEADERBOARD_SIZE } from "./leaderboard.constants";
import { DEFAULT_LEAGUE, leagueForStars, type League, type LeagueId } from "./leagues";

export { LEADERBOARD_SIZE };

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  username: string;
  stars: number;
  league: LeagueId;
}

export interface LeaderboardStanding {
  /** Position within the viewer's own band. */
  leagueRank: number;
  stars: number;
  league: LeagueId;
}

export interface LeaderboardView {
  /** The band `entries` covers, and the viewer's own band. */
  league: LeagueId;
  entries: LeaderboardEntry[];
  /** The viewer's own standing, or null if they are a guest or have no username. */
  me: LeaderboardStanding | null;
}

interface Row {
  id: string;
  username: string | null;
  stars: number;
  star_games: number;
  created_at: string;
}

const SELECT = "id, username, stars, star_games, created_at";

/** A row's sort position, used both to order the list and to count ranks. */
interface SortKey {
  stars: number;
  star_games: number;
  created_at: string;
}

/*
 * The two filter helpers below take the query builder loosely typed. Supabase's
 * builder type changes with every chained call, so threading it through a
 * generic here buys nothing — the column names are the part worth keeping in one
 * place, since the list query and both rank counts must agree on them exactly or
 * a rank will not match its row.
 */
type Filterable = any;

/**
 * Only accounts with a username appear. A guest has no durable identity, and an
 * account that has not answered the username sheet has no name to print.
 */
function listable(query: Filterable): Filterable {
  return query.not("user_id", "is", null).not("username", "is", null);
}

/** Restricts a query to one band. Diamond is open-ended, so it has no ceiling. */
function withinLeague(query: Filterable, league: League): Filterable {
  const scoped = query.gte("stars", league.minStars);
  return league.maxStars === null ? scoped : scoped.lte("stars", league.maxStars);
}

/**
 * Top players in the viewer's own league band, plus the viewer's own standing.
 *
 * The viewer's rank is counted rather than read out of the list, so it stays
 * correct when the viewer sits outside the top {@link LEADERBOARD_SIZE}.
 */
export async function getLeaderboard(userId: string | null): Promise<LeaderboardView> {
  const me = userId ? await getMyStanding(userId) : null;

  /*
   * A guest, or an account with no username, still gets a board to look at.
   * Bronze is the honest default — it is where they would start.
   */
  const league = me ? leagueForStars(me.stars) : DEFAULT_LEAGUE;

  const entries = await getEntries(league);

  return { league: league.id, entries, me };
}

async function getEntries(league: League): Promise<LeaderboardEntry[]> {
  let query = listable(getSupabaseAdmin().from("wl_players").select(SELECT));
  query = withinLeague(query, league);

  const { data, error } = await query
    /*
     * Ties broken by games played then by account age, so the order is stable
     * between loads rather than shuffling on every query. This matters far more
     * than it used to: after the migration 008 reset every account holds
     * identical stars, so the tie-break *is* the ordering for a while.
     */
    .order("stars", { ascending: false })
    .order("star_games", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(LEADERBOARD_SIZE);

  if (error) throw new Error(error.message);

  return ((data ?? []) as Row[]).map((row, index) => ({
    rank: index + 1,
    playerId: row.id,
    username: row.username!,
    stars: row.stars,
    league: leagueForStars(row.stars).id,
  }));
}

async function getMyStanding(userId: string): Promise<LeaderboardStanding | null> {
  const admin = getSupabaseAdmin();

  const { data: player } = await admin
    .from("wl_players")
    .select(SELECT)
    .eq("user_id", userId)
    .maybeSingle();

  if (!player) return null;

  const row = player as Row;

  // No username means nothing to print on the board, so no standing either.
  if (!row.username) return null;

  const league = leagueForStars(row.stars);

  const leagueRank = await countAbove(row, league);

  return { leagueRank, stars: row.stars, league: league.id };
}

/**
 * Rank as "how many listable players sort above me, plus one".
 *
 * Counting rather than searching the top-100 list keeps this correct for players
 * far down the board, and a head-only count avoids pulling every row back.
 *
 * The comparison mirrors the full three-part sort order, not just the star
 * count. Comparing stars alone would report every tied account as joint first —
 * which, immediately after the reset, is every account there is.
 */
async function countAbove(me: SortKey, league: League): Promise<number> {
  let query = listable(
    getSupabaseAdmin().from("wl_players").select("id", { count: "exact", head: true }),
  );

  query = withinLeague(query, league);

  /*
   * PostgREST spelling of the lexicographic comparison. Values are quoted
   * because a timestamp contains characters the filter grammar treats as
   * separators.
   */
  const { count } = await query.or(
    [
      `stars.gt.${me.stars}`,
      `and(stars.eq.${me.stars},star_games.gt.${me.star_games})`,
      `and(stars.eq.${me.stars},star_games.eq.${me.star_games},created_at.lt."${me.created_at}")`,
    ].join(","),
  );

  return (count ?? 0) + 1;
}
