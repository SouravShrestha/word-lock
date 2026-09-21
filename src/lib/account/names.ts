/**
 * Naming rules for the one name a player has.
 *
 * `username` is it: the unique handle an opponent sees in game, on the score bar
 * and on the leaderboard. There used to be a second, freely-editable
 * `display_name` alongside it, which bought nothing but a second prompt, a
 * second thing to render and a client-side layer to keep the two in step.
 *
 * Pure module with no client or server dependencies, so the same constants back
 * the input field, the client-side validation and the server-side Zod schemas.
 */

export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 9;

/**
 * Lowercase letters, digits and underscores. Deliberately narrow: mixed scripts
 * and lookalike characters make leaderboard entries impersonable, and a
 * case-insensitive unique index cannot protect against that on its own.
 */
export const USERNAME_PATTERN = /^[a-z0-9_]+$/;

/**
 * Handles that would let someone pose as the app or as staff, plus the app's own
 * route names. Compared case-insensitively against the normalised value.
 */
const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "moderator",
  "mod",
  "staff",
  "support",
  "help",
  "system",
  "root",
  "official",
  "wordlock",
  "word_lock",
  "api",
  "auth",
  "login",
  "logout",
  "signin",
  "signup",
  "guest",
  "anonymous",
  "player",
  "me",
  "you",
  "null",
  "undefined",
  "profile",
  "settings",
  "leaderboard",
  "history",
  "game",
  "join",
]);

export type UsernameError =
  "too_short" | "too_long" | "invalid_characters" | "reserved" | "leading_underscore";

/** Lowercases and trims so validation and storage agree on one canonical form. */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Validates an already-normalised username. Returns null when it is acceptable.
 *
 * Uniqueness is *not* checked here — that is the database's job, since any
 * check made before the insert can be beaten by a concurrent claim.
 */
export function validateUsername(normalized: string): UsernameError | null {
  // Checked before length: a handful of reserved words (e.g. "administrator",
  // "leaderboard") are longer than MAX_USERNAME_LENGTH, and impersonation risk
  // is the same regardless of why the name is too long to type.
  if (RESERVED_USERNAMES.has(normalized)) return "reserved";
  if (normalized.length < MIN_USERNAME_LENGTH) return "too_short";
  if (normalized.length > MAX_USERNAME_LENGTH) return "too_long";
  if (!USERNAME_PATTERN.test(normalized)) return "invalid_characters";
  // A leading underscore reads as a system name and sorts oddly on leaderboards.
  if (normalized.startsWith("_")) return "leading_underscore";
  return null;
}

/** Human-readable copy for each validation failure, for use directly in the UI. */
export const USERNAME_ERROR_COPY: Record<UsernameError, string> = {
  too_short: `At least ${MIN_USERNAME_LENGTH} characters.`,
  too_long: `At most ${MAX_USERNAME_LENGTH} characters.`,
  invalid_characters: "Letters, numbers and underscores only.",
  leading_underscore: "Can't start with an underscore.",
  reserved: "That one's reserved. Try another.",
};

/**
 * What to render in place of a name that is not there.
 *
 * `username` is nullable: a guest row has none, and an account has none for the
 * moment between `wl_claim_player` creating its row and the username sheet being
 * answered. Neither is a state an opponent can actually see a name in, so this
 * is a safety net rather than a label anyone is expected to read.
 */
export const UNNAMED_PLAYER = "Player";
