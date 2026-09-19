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

/** Builds an auth-aware Supabase client bound to a single incoming request. */
export function createRouteClient(request: Request): RouteClient {
  const { url, anonKey } = readEnv();
  const pending: PendingCookie[] = [];

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
    applyCookies: (response) => {
      for (const { name, value, options } of pending) {
        response.cookies.set(name, value, options);
      }
      return response;
    },
  };
}

/**
 * Returns the verified user for a request, or null when the caller is a guest.
 *
 * Uses `getUser()` rather than `getSession()` deliberately. `getSession()` only
 * decodes whatever JWT is in the cookie and will happily hand back a forged
 * one; `getUser()` validates it against the auth server. Since this result is
 * what every game mutation will trust as identity, it has to be the verified
 * form.
 */
export async function getVerifiedUser(request: Request) {
  const { supabase } = createRouteClient(request);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // A missing or expired session is the normal guest path, not a failure.
  if (error || !user) return null;
  return user;
}
