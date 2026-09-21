/**
 * Request-scoped Supabase client for Route Handlers.
 *
 * This is the *auth* client: it runs on the anon key and reads the session from
 * the request's cookies, so it can tell you who the caller actually is. It is
 * not the data client — every game mutation still goes through
 * `getSupabaseAdmin()` in `client.server.ts`, which bypasses RLS.
 *
 * Cookies are read straight off the incoming `Request` and any writes are
 * buffered until `applyCookies(response)` is called. Doing it this way rather
 * than through `next/headers` keeps the same helper usable from the middleware
 * (which runs in the Cloudflare edge runtime per `open-next.config.ts`) and
 * from route handlers, without either one needing a special case.
 *
 * Server-only: never import this from a client component.
 */
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextResponse } from "next/server";

import { parseCookieHeader } from "./cookies";
import type { Database } from "./types";

interface PendingCookie {
  name: string;
  value: string;
  options?: CookieOptions;
}

export interface RouteClient {
  supabase: ReturnType<typeof createServerClient<Database>>;
  /**
   * Copies any cookies the Supabase client wanted to write (refreshed access
   * tokens, or the cleared cookies after a sign-out) onto the outgoing
   * response. Skipping this call silently drops session updates.
   */
  applyCookies: (response: NextResponse) => NextResponse;
}

function readEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    const missing = [
      ...(!url ? ["NEXT_PUBLIC_SUPABASE_URL"] : []),
      ...(!anonKey ? ["NEXT_PUBLIC_SUPABASE_ANON_KEY"] : []),
    ];
    throw new Error(`Missing Supabase environment variable(s): ${missing.join(", ")}`);
  }

  return { url, anonKey };
}

/*
 * Keyed by the incoming `Request` object itself so `getVerifiedUser` (which
 * has no response to write to) and a route handler's own `applyCookies` call
 * can share the same pending list without threading it through every
 * function signature in between. This only works because Next.js hands every
 * function in a single request's call graph the same `Request` instance —
 * true here, but the reason this map is request-scoped rather than global.
 */
const pendingCookiesByRequest = new WeakMap<Request, PendingCookie[]>();

/** Builds an auth-aware Supabase client bound to a single incoming request. */
export function createRouteClient(request: Request): RouteClient {
  const { url, anonKey } = readEnv();
  const pending = pendingCookiesByRequest.get(request) ?? [];
  pendingCookiesByRequest.set(request, pending);

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll: () => parseCookieHeader(request.headers.get("cookie")),
      setAll: (cookiesToSet) => {
        pending.push(...cookiesToSet);
      },
    },
  });

  return {
    supabase,
    applyCookies: (response) => applyCookies(request, response),
  };
}

/**
 * Applies any cookies a Supabase auth refresh wanted to write during this
 * request onto an outgoing response.
 *
 * `middleware.ts` deliberately excludes `/api/game/*` — those routes are
 * polled every few seconds during play, and an auth-server round trip on
 * every poll would be pure latency — so a route handler calling
 * `getVerifiedUser`/`resolveCaller` is the *only* place left that can hand a
 * refreshed access-token cookie back to the browser. Skipping this on a
 * route's response silently drops the refresh: the cookie the client already
 * has goes stale, and the player looks logged out despite holding a perfectly
 * valid refresh token.
 *
 * Safe to call even when nothing refreshed anything — `pending` is then empty
 * and this is a no-op.
 */
export function applyCookies<T extends NextResponse>(request: Request, response: T): T {
  const pending = pendingCookiesByRequest.get(request);
  if (pending) {
    for (const { name, value, options } of pending) {
      response.cookies.set(name, value, options);
    }
  }
  return response;
}

/**
 * Returns the verified caller for a request, or null when it is a guest.
 *
 * Every caller of this only ever reads `.id` (see `identity.server.ts`, and
 * the claim/leaderboard routes), so the minimal `{ id }` shape returned by
 * the fast path below is a drop-in for the full `User` object `getUser()`
 * returns.
 *
 * `getSession()` is never used here: it only decodes whatever JWT is in the
 * cookie and will happily hand back a forged one. Verification is mandatory
 * since this result is what every game mutation trusts as identity — the
 * only question is *how* it gets verified:
 *
 *  - `getClaims()` checks the JWT's signature locally against the project's
 *    published JWKS, with no network round trip, and falls back to a remote
 *    check itself when the project isn't set up for local verification
 *    (legacy symmetric signing). Since `/api/game/*` is excluded from
 *    `middleware.ts` (those routes are polled every few seconds during
 *    play — see the matcher comment there), this is the only per-request
 *    auth check most of the app ever pays for, so avoiding a guaranteed
 *    round trip matters here more than almost anywhere else in the app.
 *  - Older `@supabase/supabase-js` versions do not have `getClaims` at all.
 *    Feature-detecting it means this degrades to exactly the previous
 *    `getUser()` behaviour rather than throwing, if this is ever run against
 *    an older client.
 *
 * Either path ends up doing a real signature check, so a forged cookie still
 * resolves as a guest, not as someone else.
 */
export async function getVerifiedUser(request: Request): Promise<{ id: string } | null> {
  const { supabase } = createRouteClient(request);

  const getClaims = (
    supabase.auth as unknown as {
      getClaims?: () => Promise<{ data: { claims?: { sub?: string } } | null; error: unknown }>;
    }
  ).getClaims;

  if (getClaims) {
    try {
      const { data, error } = await getClaims.call(supabase.auth);
      const sub = data?.claims?.sub;
      if (!error && sub) return { id: sub };
      if (!error) return null; // No error but no session either: a real guest.
    } catch {
      // Unexpected shape or a hard failure verifying locally — fall through
      // to the always-correct remote check rather than mis-resolve identity.
    }
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // A missing or expired session is the normal guest path, not a failure.
  if (error || !user) return null;
  return user;
}
