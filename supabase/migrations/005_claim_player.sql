-- Links an auth user to a wl_players row, absorbing the caller's guest row when
-- there is one.
--
-- This has to be a single database function rather than a sequence of calls from
-- the service layer: supabase-js has no transaction support, and a merge that
-- fails halfway would leave games pointing at a player row that no longer
-- exists, or a live game with one side detached. Running it in plpgsql makes the
-- whole thing one statement from the caller's point of view.
--
-- Idempotent by design. It is called on every sign-in and whenever an account
-- turns out to have no player row yet, so repeat calls must be cheap no-ops.
--
-- Returns the id of the wl_players row the account should use from now on.
CREATE OR REPLACE FUNCTION public.wl_claim_player(p_user_id UUID, p_session_id TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account   public.wl_players;
  v_guest     public.wl_players;
  v_new_id    UUID;
  v_session   TEXT;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id is required';
  END IF;

  -- Lock both candidate rows up front. Two tabs finishing a login at the same
  -- moment would otherwise race and could merge the same guest row twice.
  SELECT * INTO v_account
  FROM public.wl_players
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF p_session_id IS NOT NULL THEN
    SELECT * INTO v_guest
    FROM public.wl_players
    WHERE session_id = p_session_id
    FOR UPDATE;
  END IF;

  ------------------------------------------------------------------
  -- Case 1: the account has no player row yet.
  ------------------------------------------------------------------
  IF v_account.id IS NULL THEN
    -- The common first login: claim the guest row the player has been using, so
    -- everything they played before signing up carries over untouched.
    IF v_guest.id IS NOT NULL AND v_guest.user_id IS NULL THEN
      UPDATE public.wl_players
      SET user_id = p_user_id
      WHERE id = v_guest.id;
      RETURN v_guest.id;
    END IF;

    -- Either there is no guest row, or it already belongs to a different
    -- account (a shared browser). Start this account clean rather than taking
    -- over someone else's history. session_id stays NOT NULL UNIQUE, so when the
    -- incoming one is taken we mint a synthetic value.
    v_session := CASE
      WHEN v_guest.id IS NULL AND p_session_id IS NOT NULL THEN p_session_id
      ELSE gen_random_uuid()::TEXT
    END;

    INSERT INTO public.wl_players (session_id, display_name, user_id)
    VALUES (v_session, 'Player', p_user_id)
    RETURNING id INTO v_new_id;

    RETURN v_new_id;
  END IF;

  ------------------------------------------------------------------
  -- Case 2: the account already has a player row.
  ------------------------------------------------------------------

  -- Nothing to absorb: no guest row, the guest row *is* the account row, or it
  -- belongs to somebody else's account.
  IF v_guest.id IS NULL
     OR v_guest.id = v_account.id
     OR v_guest.user_id IS NOT NULL THEN
    RETURN v_account.id;
  END IF;

  ------------------------------------------------------------------
  -- Case 3: merge the guest row into the account row.
  ------------------------------------------------------------------

  -- Games played between the guest row and the account row are the same human
  -- on two devices. Repointing them would leave player1_id = player2_id, which
  -- the engine cannot score (every move would map to slot 1) and which would
  -- pollute the win/loss record with guaranteed self-wins. They are dropped
  -- instead; wl_moves cascades.
  DELETE FROM public.wl_games
  WHERE (player1_id = v_guest.id AND player2_id = v_account.id)
     OR (player1_id = v_account.id AND player2_id = v_guest.id);

  UPDATE public.wl_moves SET player_id = v_account.id WHERE player_id = v_guest.id;

  UPDATE public.wl_games SET player1_id = v_account.id WHERE player1_id = v_guest.id;
  UPDATE public.wl_games SET player2_id = v_account.id WHERE player2_id = v_guest.id;
  UPDATE public.wl_games SET winner_id = v_account.id WHERE winner_id = v_guest.id;
  UPDATE public.wl_games
  SET current_turn_player_id = v_account.id
  WHERE current_turn_player_id = v_guest.id;

  -- The account keeps its own rating, username and current streak. Only the
  -- personal best carries across, since it is a high-water mark and the guest
  -- row's games are now part of this account's history.
  UPDATE public.wl_players
  SET best_play_streak = GREATEST(v_account.best_play_streak, v_guest.best_play_streak)
  WHERE id = v_account.id;

  DELETE FROM public.wl_players WHERE id = v_guest.id;

  RETURN v_account.id;
END;
$$;

-- Called only through the service-role client in route handlers, never directly
-- from the browser.
REVOKE ALL ON FUNCTION public.wl_claim_player(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.wl_claim_player(UUID, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.wl_claim_player(UUID, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.wl_claim_player(UUID, TEXT) TO service_role;
