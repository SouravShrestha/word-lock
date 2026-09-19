-- Collapses the two names a player had into one.
--
-- `display_name` was a short, freely-editable in-game label, separate from the
-- unique `username` shown on the leaderboard. Two names meant two prompts, two
-- ways to be identified, and a reconciliation layer on the client whose whole
-- job was keeping them in step. The username is now the only name: it is what
-- opponents see in game and what the leaderboard ranks.
--
-- `wl_claim_player` is recreated first because it INSERTs `display_name`
-- explicitly, so the column cannot be dropped while the old body is installed.

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
    --
    -- No name is set here. `username` is nullable and the account picks one
    -- through the username sheet immediately after this returns.
    v_session := CASE
      WHEN v_guest.id IS NULL AND p_session_id IS NOT NULL THEN p_session_id
      ELSE gen_random_uuid()::TEXT
    END;

    INSERT INTO public.wl_players (session_id, user_id)
    VALUES (v_session, p_user_id)
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

-- Grants are not inherited by CREATE OR REPLACE on a *new* function, but this
-- replaces an existing one, so migration 005's grants still stand. Restated for
-- the benefit of a database built from these migrations in a different order.
REVOKE ALL ON FUNCTION public.wl_claim_player(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.wl_claim_player(UUID, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.wl_claim_player(UUID, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.wl_claim_player(UUID, TEXT) TO service_role;

-- Carry any real name a player had chosen over to the username, so an existing
-- account is not asked to pick a handle it effectively already has.
--
-- Only rows that have none of their own are touched, and only where the value
-- passes the same rules the picker enforces: 3-15 characters of lowercase
-- letters, digits and underscores, not starting with an underscore. A display
-- name that fails them (punctuation, the 'Player' placeholder) is left alone and
-- its owner is prompted normally.
--
-- Usernames are unique case-insensitively, so two things have to be ruled out:
-- a handle somebody already holds (the NOT EXISTS), and two display names that
-- lowercase to the same string (DISTINCT ON, which keeps only the oldest
-- account of each set and leaves the rest to pick for themselves).
WITH candidates AS (
  SELECT DISTINCT ON (lower(display_name))
         id,
         lower(display_name) AS handle
  FROM public.wl_players
  WHERE user_id IS NOT NULL
    AND username IS NULL
    AND lower(display_name) ~ '^[a-z0-9][a-z0-9_]{2,14}$'
    AND lower(display_name) NOT IN (
      'admin', 'administrator', 'moderator', 'mod', 'staff', 'support', 'help',
      'system', 'root', 'official', 'wordlock', 'word_lock', 'api', 'auth',
      'login', 'logout', 'signin', 'signup', 'guest', 'anonymous', 'player',
      'me', 'you', 'null', 'undefined', 'profile', 'settings', 'leaderboard',
      'achievements', 'history', 'game', 'join'
    )
  ORDER BY lower(display_name), created_at
)
UPDATE public.wl_players AS p
SET username = c.handle
FROM candidates AS c
WHERE p.id = c.id
  AND NOT EXISTS (
    SELECT 1 FROM public.wl_players AS other
    WHERE other.username IS NOT NULL
      AND lower(other.username) = c.handle
  );

ALTER TABLE public.wl_players
  DROP COLUMN display_name;
