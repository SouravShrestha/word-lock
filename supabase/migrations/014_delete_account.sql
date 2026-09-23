-- Account deletion, for App Store guideline 5.1.1(v): an app that offers account
-- creation must offer account deletion from inside the app, not just "email
-- support and we'll get to it".
--
-- What this does NOT do is DELETE FROM wl_players. That row is player1_id on
-- some games (NOT NULL, no fallback) and player2_id/winner_id on others (SET
-- NULL), and wl_moves cascades from wl_games — so removing it outright would
-- either violate the NOT NULL constraint on a game the caller started, or
-- silently erase an opponent's own match history the moment the caller who
-- happened to go second in that game deletes their account. Neither is
-- acceptable: the caller asked to delete their own data, not their opponents'.
--
-- Instead "delete your account" is decomposed into three steps, only the
-- second of which is this function:
--   1. The route handler forfeits every game the caller has waiting or active,
--      one at a time, through the *existing* forfeitGame() in service.server.ts
--      — not reimplemented here. That function already loads each game,
--      computes the star outcome, and writes it inside the same conditional
--      UPDATE that flips the game to completed; duplicating that in plpgsql
--      would be a second copy of star-affecting logic to keep in sync with the
--      first, for a step that is not more atomic for being in SQL — each
--      forfeit is already its own transaction, one game at a time.
--   2. This function detaches the row from the auth account (user_id -> NULL)
--      and clears the one field that is unambiguously an identity rather than a
--      game fact (username -> NULL, freeing it for reuse). Everything else —
--      stars, streak, avatar, the games it played — stays: it belongs jointly
--      to this row and to whichever opponents played against it, and match
--      history for a game two people played is not this caller's alone to
--      erase.
--   3. The route handler deletes the caller's `auth.users` row separately, via
--      the admin API — not from plpgsql, which has no access to that schema's
--      normal write path.
--
-- The result: the account cannot sign back in (auth.users row gone), holds no
-- name (username null, freeing it for someone else to claim), and is no longer
-- linked to any Supabase Auth identity (user_id null) — the same shape a
-- never-claimed guest row has. It appears in nobody's leaderboard (the partial
-- index there requires both user_id and username), and an opponent who played
-- it still sees a completed game with a real result, just against a player
-- with no name — the same "UNNAMED_PLAYER" fallback `serializeGame` already
-- renders for a null username.
--
-- Idempotent: calling this on an already-detached row is a no-op, since
-- user_id and username are already null.
CREATE OR REPLACE FUNCTION public.wl_delete_account(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id is required';
  END IF;

  UPDATE public.wl_players
  SET
    user_id = NULL,
    username = NULL
  WHERE user_id = p_user_id;

  -- No row matching p_user_id (never played, or already deleted) is not an
  -- error: the account has no game data to detach, and the route handler
  -- proceeds to delete the auth user either way.
END;
$$;

COMMENT ON FUNCTION public.wl_delete_account(UUID) IS
  'Detaches a wl_players row from the auth account (user_id, username -> NULL). Called after the route handler has already forfeited the account''s unfinished games through the ordinary forfeitGame() path. Does not delete the row itself or the auth.users row.';

-- Called only through the service-role client in the route handler, never
-- directly from the browser — same posture as wl_claim_player.
REVOKE ALL ON FUNCTION public.wl_delete_account(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.wl_delete_account(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.wl_delete_account(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.wl_delete_account(UUID) TO service_role;
