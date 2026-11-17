-- Time controls are now 5, 10 and 15 minute banks only. `daily`, `30m` and
-- `60m` are retired: no new room can pick them, but finished games keep the
-- value they were played with, so the CHECK still admits them. There were no
-- unfinished games when this shipped, so nothing needs closing.
ALTER TABLE public.wl_games
  DROP CONSTRAINT wl_games_time_control,
  ADD CONSTRAINT wl_games_time_control
    CHECK (time_control IN ('5m', '10m', '15m', '30m', '60m', 'daily')),
  ALTER COLUMN time_control SET DEFAULT '10m';
