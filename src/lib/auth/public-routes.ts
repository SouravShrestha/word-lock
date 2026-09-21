/**
 * The handful of routes that are readable without an account.
 *
 * An account is required to *play*, and the login wall is deliberately the whole
 * screen everywhere else. The exceptions are the pages someone reads *before*
 * deciding to sign up, and not as a convenience: a privacy policy that can only
 * be read after signing up is useless to the person deciding whether to sign up,
 * the rules are what you send to a friend you are trying to recruit, and ad
 * networks and search engines crawl both with a bot that will never log in.
 *
 * Pure and client-safe. `AuthGate` is the only caller — keep it that way, so
 * "which screens are public" stays one list rather than a condition sprinkled
 * across surfaces.
 */

/** Matched as path prefixes, so `/legal` covers every page beneath it. */
const PUBLIC_PREFIXES = ["/legal", "/how-to-play"] as const;

export function isPublicRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
