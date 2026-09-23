export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 9;

export const USERNAME_PATTERN = /^[a-z0-9_]+$/;

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

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateUsername(normalized: string): UsernameError | null {
  if (RESERVED_USERNAMES.has(normalized)) return "reserved";
  if (normalized.length < MIN_USERNAME_LENGTH) return "too_short";
  if (normalized.length > MAX_USERNAME_LENGTH) return "too_long";
  if (!USERNAME_PATTERN.test(normalized)) return "invalid_characters";
  if (normalized.startsWith("_")) return "leading_underscore";
  return null;
}

export const USERNAME_ERROR_COPY: Record<UsernameError, string> = {
  too_short: `At least ${MIN_USERNAME_LENGTH} characters.`,
  too_long: `At most ${MAX_USERNAME_LENGTH} characters.`,
  invalid_characters: "Letters, numbers and underscores only.",
  leading_underscore: "Can't start with an underscore.",
  reserved: "That one's reserved. Try another.",
};

export const UNNAMED_PLAYER = "Player";
