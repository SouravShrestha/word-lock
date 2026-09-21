/**
 * Persists star changes when a game completes. Server-only.
 */
import { getSupabaseAdmin } from "@/integrations/supabase/client.server";
import { applyDelta, scoreForPlayerA, starDeltas } from "./stars";
import type { GameRow } from "./rows";

interface RatedRow {
  id: string;
  user_id: string | null;
  stars: number;
  peak_stars: number;
  star_games: number;
}

export interface StarOutcome {
  p1Delta: number | null;
  p2Delta: number | null;
  /**
   * Star counts the two players end this game on, after the floor is applied.
   * Recorded on the game row so the profile's star curve can read what the
   * ladder actually held rather than replaying deltas — a loss clamped at
   * MIN_STARS records more than it took, so a replay drifts.
   *
   * Null exactly when the matching delta is null: an unranked game moves nobody.
   */
  p1StarsAfter: number | null;
  p2StarsAfter: number | null;
}

/**
 * The "nothing moved" outcome. Exported because a caller that cannot even load
 * the game has to write the same nulls, and spelling them out at each call site
 * is how a new field gets missed.
 */
export const UNRANKED_OUTCOME: StarOutcome = {
  p1Delta: null,
  p2Delta: null,
  p1StarsAfter: null,
  p2StarsAfter: null,
};

/**
 * Writes a player's new star count, raising their peak if this is a new high.
 *
 * Takes the already-clamped total rather than recomputing it, so the value
 * written here and the one recorded on the game row cannot disagree.
 */
async function updateStars(player: RatedRow, stars: number): Promise<void> {
  await getSupabaseAdmin()
    .from("wl_players")
    .update({
      stars,
      peak_stars: Math.max(player.peak_stars, stars),
      star_games: player.star_games + 1,
    })
    .eq("id", player.id);
}

/**
 * Works out the star movement for a finished game without writing anything.
 *
 * Split from the write so the deltas can go into the same UPDATE that marks the
 * game completed — that update is conditional on the game not already being
 * completed, which is what keeps stars from being awarded twice if two requests
 * race to finish the same game.
 *
 * Returns nulls when the game is unranked: either side missing an account means
 * no star change, and null deltas are how `wl_games` records that.
 */
export async function computeStarOutcome(
  game: GameRow,
  winnerId: string | null,
): Promise<{ outcome: StarOutcome; commit: () => Promise<void> }> {
  if (!game.player2_id) return { outcome: UNRANKED_OUTCOME, commit: async () => {} };

  const { data } = await getSupabaseAdmin()
    .from("wl_players")
    .select("id, user_id, stars, peak_stars, star_games")
    .in("id", [game.player1_id, game.player2_id]);

  const rows = (data ?? []) as RatedRow[];
  const p1 = rows.find((r) => r.id === game.player1_id);
  const p2 = rows.find((r) => r.id === game.player2_id);

  if (!p1 || !p2) return { outcome: UNRANKED_OUTCOME, commit: async () => {} };

  // Both sides need a real account for the result to move the ladder.
  if (!p1.user_id || !p2.user_id) return { outcome: UNRANKED_OUTCOME, commit: async () => {} };

  const { deltaA, deltaB } = starDeltas(p1.stars, p2.stars, scoreForPlayerA(p1.id, winnerId));

  // Resolved here, in the compute half, so the totals travel into the same
  // UPDATE that marks the game completed. Working them out inside `commit`
  // instead would record a snapshot the game row never saw.
  const starsAfterA = applyDelta(p1.stars, deltaA);
  const starsAfterB = applyDelta(p2.stars, deltaB);

  return {
    outcome: {
      p1Delta: deltaA,
      p2Delta: deltaB,
      p1StarsAfter: starsAfterA,
      p2StarsAfter: starsAfterB,
    },
    // Called only once the game has actually been flipped to completed.
    commit: async () => {
      await Promise.all([updateStars(p1, starsAfterA), updateStars(p2, starsAfterB)]);
    },
  };
}
