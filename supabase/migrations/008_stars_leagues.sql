-- Replaces the Elo rating with the star ladder and its five leagues.
--
-- Why this is not just a rename: Elo is mean-preserving. Every account starting
-- at the same number means the population average never moves, so league bands
-- placed above that average would be unreachable by construction. The star
-- ladder is deliberately inflationary — a win pays more than a loss costs — so
-- the bands describe progress rather than a percentile. See the module comment
-- in src/lib/game/stars.ts.
--
-- Because the maths changed, old numbers do not carry meaning forward and every
-- account is reset. That is a one-off, agreed deliberately: standings under the
-- old system cannot be translated into the new one, and a partial translation
-- would be worse than a clean start.
--
-- The columns are renamed rather than added-and-backfilled so there is exactly
-- one vocabulary end to end. Half-renamed domains are where bugs live.
-- BASE_STARS in src/lib/game/stars.ts is the application-side mirror of the
-- defaults set here, and the bands live in src/lib/account/leagues.ts.

ALTER TABLE public.wl_players RENAME COLUMN rating TO stars;
ALTER TABLE public.wl_players RENAME COLUMN peak_rating TO peak_stars;
ALTER TABLE public.wl_players RENAME COLUMN rating_games TO star_games;

ALTER TABLE public.wl_games RENAME COLUMN p1_rating_delta TO p1_star_delta;
ALTER TABLE public.wl_games RENAME COLUMN p2_rating_delta TO p2_star_delta;

-- New accounts start mid-Bronze, so the first league has room to fall as well as
-- climb. Migration 007 had set these to 0.
ALTER TABLE public.wl_players
  ALTER COLUMN stars SET DEFAULT 200,
  ALTER COLUMN peak_stars SET DEFAULT 200;

-- The reset. star_games goes back to zero too: it counted rated games under the
-- old system and is now the ladder's games-played figure, used for leaderboard
-- tie-breaks. Guest rows are included — they hold the default either way, and
-- excluding them would only add a predicate that changes nothing.
UPDATE public.wl_players
SET
  stars = 200,
  peak_stars = 200,
  star_games = 0;

-- Historical per-game deltas were measured in the old currency. Leaving them
-- would have match history report star movements that never happened and that
-- do not add up to any account's current total. Null already means "unranked"
-- to the read path, which renders as no delta shown.
UPDATE public.wl_games
SET
  p1_star_delta = NULL,
  p2_star_delta = NULL
WHERE p1_star_delta IS NOT NULL
   OR p2_star_delta IS NOT NULL;

-- The partial index from migration 004 followed the column rename automatically,
-- but its name and its predicate are both now wrong: the `rating_games >= 3`
-- eligibility gate is gone, so every named account is listed, and the league tab
-- queries a star range rather than the whole table. An index on (stars DESC)
-- restricted to listable accounts serves both scopes — the league scope is the
-- same ordered scan with a range predicate.
DROP INDEX IF EXISTS public.wl_players_leaderboard_idx;

CREATE INDEX wl_players_leaderboard_idx
  ON public.wl_players (stars DESC, star_games DESC, created_at)
  WHERE user_id IS NOT NULL AND username IS NOT NULL;
