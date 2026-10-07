-- Streak Freeze: one missed day is forgiven, then the freeze recharges for
-- seven days (FREEZE_COOLDOWN_DAYS in packages/core/src/game/streak.ts).
--
-- last_freeze_on is the most recent missed day a freeze covered, as a DATE in
-- the player's own timezone like last_played_on. Null means no freeze was ever
-- used, which reads as "charged" — so no existing streak is lost on deploy.
-- Before this a missed day was forgiven every time, with no recharge.
--
-- Only the latest is kept: frozen days are at least seven days apart, so a
-- seven-day calendar row can show at most one.
ALTER TABLE public.wl_players
  ADD COLUMN last_freeze_on DATE;
