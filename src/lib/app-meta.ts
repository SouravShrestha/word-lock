/**
 * Static facts about the app itself: which build this is, where to reach a
 * human, and the pages that live outside the game.
 *
 * Pure and client-safe. Everything here is a constant rather than a lookup so
 * the About sheet never has to wait on a request to render.
 */

/** Inlined from package.json by next.config.ts. */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0";

/** Where "Help" sends mail. Change this and every support link follows. */
export const SUPPORT_EMAIL = "souravshrestha@cbsdev.me";

/** The person behind the game, credited in About. */
export const AUTHOR_NAME = "Sourav Shrestha";
export const AUTHOR_URL = "https://www.cbsdev.me/";

export const REPO_URL = "https://github.com/SouravShrestha/word-lock";
export const CHANGELOG_URL = `${REPO_URL}/blob/main/CHANGELOG.md`;
export const LICENSE_URL = `${REPO_URL}/blob/main/LICENSE`;

/** Source of the 370k-word dictionary in `data/words_alpha.txt`. */
export const WORDLIST_URL = "https://github.com/dwyl/english-words";

/*
 * Legal pages. Null until each one is actually published — the Support rows key
 * off these and hide themselves rather than linking a player to a 404. Set the
 * URL (or a local path like "/legal/privacy") and the row appears.
 */
export const PRIVACY_URL: string | null = null;
export const TERMS_URL: string | null = null;

/**
 * The app's public origin. Prefers the configured site URL, since that is what
 * is safe to hand to someone else, and falls back to the current origin for
 * local work where the variable may be unset.
 */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (configured) return configured;
  return typeof window === "undefined" ? "" : window.location.origin;
}

/**
 * A `mailto:` for support, pre-filled with the build and browser.
 *
 * Those two lines are the whole point: almost every "it broke" email is
 * unanswerable without them, and nobody thinks to include them unprompted.
 */
export function supportMailto(subject = "Word lock support"): string {
  const lines = [
    "",
    "",
    "---",
    `Version: ${APP_VERSION}`,
    `Device: ${typeof navigator === "undefined" ? "unknown" : navigator.userAgent}`,
  ];
  /*
   * Hand-encoded rather than via URLSearchParams: that encodes a space as "+",
   * which mail clients show literally in the subject line.
   */
  const query = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
  return `mailto:${SUPPORT_EMAIL}?${query}`;
}
