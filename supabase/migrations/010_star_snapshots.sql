-- Star snapshots: what each player's star count *was* after a game completed.
--
-- The per-game deltas alone cannot reconstruct a star curve. Two reasons:
--
--  1. `applyDelta` clamps at MIN_STARS (0), so a player who bottomed out has a
--     recorded delta larger than the change that actually happened. Replaying
--     the deltas forward from BASE_STARS drifts away from their real total.
--  2. Migration 008 nulled every historical delta when the currency changed, so
--     for older accounts a replay cannot reach the current total at all.
--
-- Storing the post-game value removes both problems: the chart reads the number
-- the ladder actually held at that moment instead of inferring it.
--
-- Nullable, and deliberately not backfilled — games that completed before this
-- migration have no recorded value and are simply absent from the curve. Null
-- also covers unranked games, matching how `pN_star_delta` already reads.
ALTER TABLE public.wl_games
  ADD COLUMN p1_stars_after integer,
  ADD COLUMN p2_stars_after integer;

COMMENT ON COLUMN public.wl_games.p1_stars_after IS
  'Player 1 star count immediately after this game, post-clamp. Null when unranked or completed before migration 010.';

COMMENT ON COLUMN public.wl_games.p2_stars_after IS
  'Player 2 star count immediately after this game, post-clamp. Null when unranked or completed before migration 010.';

-- The star curve is read per player, newest games first, across every completed
-- game they took part in. Both existing indexes are on the player columns alone;
-- adding the sort key lets the history query be served without a sort.
CREATE INDEX IF NOT EXISTS wl_games_p1_history_idx
  ON public.wl_games (player1_id, last_move_at DESC)
  WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS wl_games_p2_history_idx
  ON public.wl_games (player2_id, last_move_at DESC)
  WHERE status = 'completed';
