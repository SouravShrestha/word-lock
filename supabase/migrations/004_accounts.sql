-- Accounts: link wl_players rows to Supabase Auth users, and give logged-in
-- players the persisted values the gated UI surfaces promise (unique username,
-- Elo rating, daily play streak).
--
-- Guests keep working exactly as before: every new column is nullable or
-- defaulted, so an anonymous wl_players row is still valid.

-- One auth user maps to at most one player row. ON DELETE SET NULL keeps the
-- games and moves intact if the account is ever deleted — the row simply
-- reverts to being an orphaned guest rather than cascading away match history.
ALTER TABLE public.wl_players
  ADD COLUMN user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

-- Public handle for the leaderboard. Distinct from display_name, which stays
-- the short in-game label. Settable exactly once (enforced in the service
-- layer, which refuses to overwrite a non-null value).
ALTER TABLE public.wl_players
  ADD COLUMN username TEXT;

-- Case-insensitive uniqueness. This index is the actual arbiter for races
-- between two players claiming the same handle; the availability check in the
-- API is only a courtesy.
CREATE UNIQUE INDEX wl_players_username_lower_idx
  ON public.wl_players (lower(username))
  WHERE username IS NOT NULL;

-- Elo. rating_games drives the provisional (higher-K) window for new accounts,
-- and peak_rating is a high-water mark so the profile can show a personal best
-- without replaying every game's rating history.
ALTER TABLE public.wl_players
  ADD COLUMN rating INTEGER NOT NULL DEFAULT 1000,
  ADD COLUMN peak_rating INTEGER NOT NULL DEFAULT 1000,
  ADD COLUMN rating_games INTEGER NOT NULL DEFAULT 0;

-- Daily "played a game today" streak. last_played_on is a DATE in the player's
-- own timezone, not UTC — timezone holds the IANA name reported by the browser
-- so the server can resolve the correct local day boundary.
ALTER TABLE public.wl_players
  ADD COLUMN play_streak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN best_play_streak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN last_played_on DATE,
  ADD COLUMN timezone TEXT;

-- Leaderboard read path: only ranked accounts are listed, so the index is
-- partial on that condition.
CREATE INDEX wl_players_leaderboard_idx
  ON public.wl_players (rating DESC)
  WHERE user_id IS NOT NULL AND username IS NOT NULL;

-- Per-game rating movement, so match history can show "+12" without having to
-- replay every game to reconstruct it. Null means the game was unranked.
ALTER TABLE public.wl_games
  ADD COLUMN p1_rating_delta INTEGER,
  ADD COLUMN p2_rating_delta INTEGER;

-- Migration 002 granted anon a blanket SELECT on wl_players to make Realtime
-- work, but the client only ever subscribes to wl_games and wl_moves. The
-- policy exposed every row's session_id, and session_id is the bearer-equivalent
-- that identifies a guest — anyone with the public anon key could harvest them
-- and act as any player. Nothing reads this table client-side, so drop it.
DROP POLICY IF EXISTS "Enable read access for all users" ON public.wl_players;
