-- Gives every player a picture of their own.
--
-- Until now a player's face was invented at render time: the match list hashed
-- the opponent's id to pick between two hand-drawn animals, the lobby hardcoded
-- one animal per slot, and the profile always showed the panda. Three surfaces,
-- three different answers for the same person. Storing the choice is what makes
-- it one answer, and it is the player's to make.
--
-- The column holds an **id**, not a URL: `avatar_01`, `avatar_02`, and so on.
-- The bucket, the file extension and the CDN host are presentation, and they are
-- composed in one place (`avatarUrl` in src/lib/account/avatars.ts). Storing a
-- full URL would bake today's storage layout into every row and make moving the
-- files a data migration.
--
-- NOT NULL with a default rather than nullable: everyone has a face, including
-- guests and rows that predate this migration, so the read path never has to
-- carry a "no avatar" branch. `avatar_01` is the default by convention, matching
-- DEFAULT_AVATAR_ID on the application side.
--
-- The CHECK is a shape rule, not a whitelist. The set of available avatars grows
-- (five today, fifty later) and the app already refuses an id it does not know
-- via `isAvatarId`, so pinning the exact list here would mean a migration every
-- time artwork is added while buying nothing the application layer does not
-- already enforce. What it does buy is that the column can never hold a path, a
-- URL, or an empty string.

ALTER TABLE public.wl_players
  ADD COLUMN avatar TEXT NOT NULL DEFAULT 'avatar_01'
  CONSTRAINT wl_players_avatar_format CHECK (avatar ~ '^avatar_[0-9]{2}$');
