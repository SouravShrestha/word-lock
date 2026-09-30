-- Time controls, chosen by the host when creating a room.
--
-- `daily` is the pace every game had before this migration: 24 hours per move,
-- and an expired move is passed for the player. It is the column default, so
-- every existing row keeps exactly the behaviour it was created with.
--
-- `10m`, `30m` and `60m` are a chess-style bank per player. Only the player on
-- turn is ticking; running out is a loss (end_reason 'timeout').
--
-- pN_clock_ms is the bank at the start of the current turn, not a live value:
-- the player on turn has `pN_clock_ms - (now - last_move_at)` left, and that
-- subtraction is committed when their move lands. Null for `daily` games.
--
-- turn_deadline is stored rather than derived because the sweep has to find
-- expired turns across games with different limits. Before this there was one
-- limit, so `last_move_at < now - 24h` was enough; now there is no single
-- cutoff, and the partial index keeps `turn_deadline < now` cheap.
ALTER TABLE public.wl_games
  ADD COLUMN time_control TEXT NOT NULL DEFAULT 'daily'
    CONSTRAINT wl_games_time_control CHECK (time_control IN ('daily', '10m', '30m', '60m')),
  ADD COLUMN p1_clock_ms INTEGER,
  ADD COLUMN p2_clock_ms INTEGER,
  ADD COLUMN turn_deadline TIMESTAMPTZ;

UPDATE public.wl_games
  SET turn_deadline = last_move_at + INTERVAL '24 hours'
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS wl_games_active_turn_deadline_idx
  ON public.wl_games (turn_deadline)
  WHERE status = 'active';
