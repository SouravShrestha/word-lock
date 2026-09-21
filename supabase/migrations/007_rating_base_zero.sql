-- Rebaseline Elo so a new account starts at 0 instead of 1000.
--
-- The rating maths is difference-based, so shifting every account down by the
-- old base leaves all relative standings and future deltas untouched. What it
-- changes is how the number reads: a player's rating is now points they earned,
-- not a handout they can only lose. `BASE_RATING` in src/lib/game/elo.ts is the
-- application-side mirror of these defaults.

ALTER TABLE public.wl_players
  ALTER COLUMN rating SET DEFAULT 0,
  ALTER COLUMN peak_rating SET DEFAULT 0;

-- Existing rows carry the old 1000 base. Shift them down by it, clamped at the
-- new floor of 0 so nobody lands negative (the old floor was 100, so in
-- practice the clamp only catches accounts that had already bottomed out).
-- peak_rating is shifted the same way to stay a valid high-water mark, and is
-- kept at or above the shifted current rating.
UPDATE public.wl_players
SET
  rating = GREATEST(rating - 1000, 0),
  peak_rating = GREATEST(peak_rating - 1000, rating - 1000, 0);
