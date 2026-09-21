/**
 * Minimal cookie-header parsing for the request-scoped Supabase client.
 *
 * `@supabase/ssr` ships its own `parseCookieHeader`, but its return shape has
 * churned across releases. A dozen lines of our own keeps the auth plumbing
 * independent of that, and makes the edge cases (chunked auth cookies, values
 * containing `=`) directly testable.
 */

export interface CookiePair {
  name: string;
  value: string;
}

/**
 * Parses a `Cookie` request header into name/value pairs.
 *
 * Values are split on the *first* `=` only: Supabase auth cookies hold
 * base64-encoded JSON, which routinely contains `=` padding, and splitting on
 * every separator would truncate the token.
 */
export function parseCookieHeader(header: string | null | undefined): CookiePair[] {
  if (!header) return [];

  const pairs: CookiePair[] = [];
  for (const part of header.split(";")) {
    const segment = part.trim();
    if (!segment) continue;

    const separator = segment.indexOf("=");
    // A bare cookie name with no `=` is malformed; skip rather than emit an
    // entry the Supabase client would have to interpret.
    if (separator < 1) continue;

    const name = segment.slice(0, separator).trim();
    const raw = segment.slice(separator + 1).trim();
    if (!name) continue;

    pairs.push({ name, value: safeDecode(raw) });
  }

  return pairs;
}

/**
 * Cookie values are normally percent-encoded, but a malformed sequence would
 * throw and take the whole request down. A value we cannot decode is far more
 * likely to be a stale or hand-edited cookie than a real session, so fall back
 * to the raw string and let the Supabase client reject it.
 */
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
