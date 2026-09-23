-- Migration 011 scoped the browser's Realtime reads on `wl_games`/`wl_moves`
-- to "one of the two players in this game", which is right, but it wrote the
-- check as an EXISTS over `public.wl_players` — and `wl_players` has RLS
-- enabled with *no* SELECT policy at all (migration 004 dropped the blanket
-- one from 002 and never replaced it, because nothing reads that table from
-- the browser).
--
-- A subquery inside a policy is evaluated as the subscriber, so it is subject
-- to `wl_players`' own RLS. With no policy there the EXISTS can only ever see
-- zero rows, so the `wl_games`/`wl_moves` policies never pass and Realtime
-- filters out every row change for every subscriber.
--
-- That failure is silent: `subscribe()` still reports SUBSCRIBED, the socket is
-- healthy, and `broadcast` keeps working (it is not row-filtered, and the
-- reaction payload is pushed server-side with the service-role key). Which is
-- exactly the symptom — emoji reactions arrive, opponents joining the lobby,
-- opponent moves and the host-left DELETE do not.
--
-- The fix keeps 011's intent and its closed read. A SECURITY DEFINER helper
-- resolves the caller's own player rows, so the membership check no longer
-- depends on a `wl_players` SELECT policy and `session_id` stays unreadable
-- from the browser. `wl_players` deliberately still has no SELECT policy.

CREATE OR REPLACE FUNCTION public.wl_caller_player_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.wl_players WHERE user_id = auth.uid();
$$;

COMMENT ON FUNCTION public.wl_caller_player_ids() IS
  'The wl_players rows belonging to the authenticated caller. SECURITY DEFINER so RLS policies can check game membership without granting the browser a SELECT on wl_players (which would expose session_id). Returns nothing for an anonymous or guest caller.';

REVOKE ALL ON FUNCTION public.wl_caller_player_ids() FROM PUBLIC;
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

-- Safe to reach through `wl_games` here: the policy above now passes for a
-- player, so the nested read resolves.
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
