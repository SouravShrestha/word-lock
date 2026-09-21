-- Migration 002 opened `wl_games` and `wl_moves` to any anon reader
-- ("Enable read access for all users", USING (true)) so Realtime's
-- `postgres_changes` subscriptions would work. That policy was never
-- revisited: migration 004 dropped the equivalent blanket policy on
-- `wl_players` because it exposed every guest's `session_id` — the
-- bearer-equivalent that lets anyone act as that guest — but `wl_games` and
-- `wl_moves` were left wide open. Both are exactly as sensitive: a game row
-- and its move history is a durable, readable-by-anyone log of one specific
-- match between two named accounts, discoverable by anyone with the public
-- anon key and no auth at all.
--
-- Login is mandatory to reach the game screen (see AGENTS.md), so every real
-- subscriber is an authenticated user. Scoping the policy to "one of the two
-- players in this game" costs nothing for the app's own traffic and closes
-- the open read.
--
-- Server-side reads are untouched: every route handler in `src/app/api/game`
-- goes through `getSupabaseAdmin()` (the service-role client), which bypasses
-- RLS entirely. This policy governs exactly one path — the browser's own
-- Realtime subscription in `GameClient.tsx` — which only ever needs to see
-- games the viewer is actually playing.

DROP POLICY IF EXISTS "Enable read access for all users" ON public.wl_games;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.wl_moves;

CREATE POLICY "Players can read their own games" ON public.wl_games
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.wl_players p
      WHERE p.user_id = auth.uid()
        AND p.id IN (wl_games.player1_id, wl_games.player2_id)
    )
  );

CREATE POLICY "Players can read moves in their own games" ON public.wl_moves
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.wl_games g
      JOIN public.wl_players p ON p.id IN (g.player1_id, g.player2_id)
      WHERE g.id = wl_moves.game_id
        AND p.user_id = auth.uid()
    )
  );
