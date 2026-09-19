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
}

const UNRANKED: StarOutcome = { p1Delta: null, p2Delta: null };

/** Writes a player's new star count, raising their peak if this is a new high. */
async function updateStars(player: RatedRow, delta: number): Promise<void> {
  const stars = applyDelta(player.stars, delta);
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
  if (!game.player2_id) return { outcome: UNRANKED, commit: async () => {} };

  const { data } = await getSupabaseAdmin()
    .from("wl_players")
    .select("id, user_id, stars, peak_stars, star_games")
    .in("id", [game.player1_id, game.player2_id]);

  const rows = (data ?? []) as RatedRow[];
  const p1 = rows.find((r) => r.id === game.player1_id);
  const p2 = rows.find((r) => r.id === game.player2_id);

  if (!p1 || !p2) return { outcome: UNRANKED, commit: async () => {} };

  // Both sides need a real account for the result to move the ladder.
  if (!p1.user_id || !p2.user_id) return { outcome: UNRANKED, commit: async () => {} };

  const { deltaA, deltaB } = starDeltas(p1.stars, p2.stars, scoreForPlayerA(p1.id, winnerId));

  return {
    outcome: { p1Delta: deltaA, p2Delta: deltaB },
    // Called only once the game has actually been flipped to completed.
    commit: async () => {
      await Promise.all([updateStars(p1, deltaA), updateStars(p2, deltaB)]);
    },
  };
}
