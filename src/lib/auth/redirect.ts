/**
 * Redirect handling for the auth flow.
 *
 * Both Google OAuth and magic links come back through `/auth/callback` with a
 * `next` parameter saying where the player was when they logged in. That value
 * arrives from an email link or an OAuth provider, so it is attacker-reachable
 * and has to be treated as untrusted input — an unvalidated `next` turns the
 * callback into an open redirect that can be used to phish players with a
 * genuine wordlock.cbsdev.me link.
 */

/** Fallback destination when `next` is missing or rejected. */
const DEFAULT_NEXT = "/";

/** Long enough for any real in-app path, short enough to bound abuse. */
const MAX_NEXT_LENGTH = 512;

/**
 * Normalises the `next` parameter to a safe same-origin path.
 *
 * Only relative paths are allowed through. Anything absolute, protocol-relative
 * or otherwise ambiguous falls back to the home screen rather than erroring,
 * since a bad `next` should not cost the player a successful login.
 */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw) return DEFAULT_NEXT;
  if (raw.length > MAX_NEXT_LENGTH) return DEFAULT_NEXT;

  // Header/path injection via encoded or literal newlines and NULs.
  // eslint-disable-next-line no-control-regex -- intentionally matching control chars to reject them
  if (/[\x00-\x1f\x7f]/.test(raw)) return DEFAULT_NEXT;

  // Must be a root-relative path. This rejects "https://evil.com",
  // "//evil.com" (protocol-relative) and bare "evil.com" in one go.
  if (!raw.startsWith("/")) return DEFAULT_NEXT;
  if (raw.startsWith("//")) return DEFAULT_NEXT;

  // Backslashes are normalised to forward slashes by some browsers, so "/\evil.com"
  // can escape the origin even though it looks relative.
  if (raw.includes("\\")) return DEFAULT_NEXT;

  // Bouncing back into the auth routes would either loop or land the player on
  // a callback with no code to exchange.
  if (raw === "/auth" || raw.startsWith("/auth/")) return DEFAULT_NEXT;

  return raw;
}

/**
 * The public origin of this deployment.
 *
 * `NEXT_PUBLIC_SITE_URL` is preferred over anything derived from the request:
 * each environment sets its own, and `Host`/`X-Forwarded-Host` headers are
 * caller-controlled, so trusting them would let someone steer the post-login
 * redirect off-origin. The request URL is only a fallback for local dev where
 * the variable may be unset.
 */
export function resolveOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return new URL(request.url).origin;
}

/**
 * Builds an absolute redirect URL for the auth flow, optionally carrying an
 * error code the UI can surface.
 */
export function buildRedirectUrl(origin: string, path: string, error?: string | null): string {
  const url = new URL(safeNextPath(path), origin);
  if (error) url.searchParams.set("auth_error", error);
  return url.toString();
}
