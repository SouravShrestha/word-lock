/**
 * Persists the daily play streak. Server-only.
 *
 * Deliberately called from the move and pass paths only — the actions a player
 * actually takes. An auto-pass from the turn-expiry sweep must not count: it
 * fires 24 hours after the player stopped playing, so crediting it would hand
 * out streak days for inactivity.
 */
import { getSupabaseAdmin } from "@/integrations/supabase/client.server";
import { advanceStreak, localDate, type PlayerAccountRow } from "@word-lock/core/game";

/**
 * Records that `player` took a turn now, in their own timezone.
 *
 * Returns the updated streak values, or the existing ones when today was already
 * counted. Errors are swallowed: a failed streak write must not roll back a move
 * the player has legitimately made.
 */
export async function touchPlayStreak(
  player: PlayerAccountRow,
  timezone?: string | null,
  now: Date = new Date(),
): Promise<{ playStreak: number; bestPlayStreak: number }> {
  const today = localDate(now, timezone ?? player.timezone);

  const next = advanceStreak(
    {
      play_streak: player.play_streak,
      best_play_streak: player.best_play_streak,
      last_played_on: player.last_played_on,
    },
    today,
  );

  // Already played today, which is the common case for any turn after the first.
  if (!next) {
    return { playStreak: player.play_streak, bestPlayStreak: player.best_play_streak };
  }

  try {
    await getSupabaseAdmin()
      .from("wl_players")
      .update({
        play_streak: next.play_streak,
        best_play_streak: next.best_play_streak,
        last_played_on: next.last_played_on,
      })
      .eq("id", player.id);
  } catch {
    return { playStreak: player.play_streak, bestPlayStreak: player.best_play_streak };
  }

  return { playStreak: next.play_streak, bestPlayStreak: next.best_play_streak };
}
