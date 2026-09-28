-- Records the Realtime read policies that are actually live.
--
-- Migration 011 scoped `wl_games` and `wl_moves` to "one of the two players",
-- but it resolved the viewer with a direct subquery on `public.wl_players`.
-- That table has RLS enabled and — since migration 004 dropped the blanket
-- policy that leaked every guest's `session_id` — no SELECT policy at all.
-- Postgres applies RLS to every table a policy reads, as the subscriber's own
-- role, so for `authenticated` the subquery always saw zero rows, EXISTS was
-- always false, and Realtime silently dropped every change. The subscription
-- still reported SUBSCRIBED, so the clients' polling fallback stayed off: the
-- host never saw the opponent join, and moves never arrived.
--
-- The fix — a SECURITY DEFINER helper that returns only the caller's own
-- player id — was applied to the live databases directly and never committed.
-- This migration writes it down, verbatim from `pg_get_functiondef` and
-- `pg_policies`, so a database built from this directory matches production.
-- Every statement is idempotent: on test and prod it changes nothing.
--
-- A SELECT policy on `wl_players` would also have made 011's subquery match,
-- and was rejected: it would reopen direct reads of the table 004 closed. The
-- helper exposes one uuid — the caller's own — and nothing else from the row.

CREATE OR REPLACE FUNCTION public.wl_caller_player_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM public.wl_players WHERE user_id = auth.uid();
$$;

-- Live proacl is {postgres=X/postgres,authenticated=X/postgres}: no PUBLIC,
-- no anon. auth.uid() is null for anon anyway, but the grant says so plainly.
REVOKE ALL ON FUNCTION public.wl_caller_player_ids() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.wl_caller_player_ids() FROM anon;
GRANT EXECUTE ON FUNCTION public.wl_caller_player_ids() TO authenticated;

DROP POLICY IF EXISTS "Players can read their own games" ON public.wl_games;
DROP POLICY IF EXISTS "Players can read moves in their own games" ON public.wl_moves;

CREATE POLICY "Players can read their own games" ON public.wl_games
  FOR SELECT
  TO authenticated
  USING (
    player1_id IN (SELECT public.wl_caller_player_ids())
    OR player2_id IN (SELECT public.wl_caller_player_ids())
  );

CREATE POLICY "Players can read moves in their own games" ON public.wl_moves
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.wl_games g
      WHERE g.id = wl_moves.game_id
        AND (
          g.player1_id IN (SELECT public.wl_caller_player_ids())
          OR g.player2_id IN (SELECT public.wl_caller_player_ids())
        )
    )
  );
