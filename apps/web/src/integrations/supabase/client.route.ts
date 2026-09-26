import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextResponse } from "next/server";

import { parseCookieHeader } from "./cookies";
import type { Database } from "@word-lock/core/db";

export interface PendingCookie {
  name: string;
  value: string;
  options?: CookieOptions;
}

export interface RouteClient {
  supabase: ReturnType<typeof createServerClient<Database>>;
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

const pendingCookiesByRequest = new WeakMap<Request, PendingCookie[]>();

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
 * Queues a cookie to be written by the same buffer `applyCookies` already
 * drains on every route's response — callers outside the Supabase client
 * (e.g. the guest-session binding cookie in `identity.server.ts`) can piggyback
 * on this instead of every route handler having to plumb an extra cookie write.
 */
export function queueCookie(request: Request, cookie: PendingCookie): void {
  const pending = pendingCookiesByRequest.get(request) ?? [];
  pending.push(cookie);
  pendingCookiesByRequest.set(request, pending);
}

export function applyCookies<T extends NextResponse>(request: Request, response: T): T {
  const pending = pendingCookiesByRequest.get(request);
  if (pending) {
    for (const { name, value, options } of pending) {
      response.cookies.set(name, value, options);
    }
  }
  return response;
}

const BEARER_PREFIX = "Bearer ";

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header || !header.startsWith(BEARER_PREFIX)) return null;
  const token = header.slice(BEARER_PREFIX.length).trim();
  return token.length > 0 ? token : null;
}

async function verifyBearerToken(token: string): Promise<{ id: string } | null> {
  const { url, anonKey } = readEnv();
  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: { getAll: () => [], setAll: () => {} },
  });

  const getClaims = (
    supabase.auth as unknown as {
      getClaims?: (
        jwt: string,
      ) => Promise<{ data: { claims?: { sub?: string } } | null; error: unknown }>;
    }
  ).getClaims;

  if (getClaims) {
    try {
      const { data, error } = await getClaims.call(supabase.auth, token);
      const sub = data?.claims?.sub;
      if (!error && sub) return { id: sub };
      if (!error) return null;
    } catch {
      // Fall through to remote check
    }
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export async function getVerifiedUser(request: Request): Promise<{ id: string } | null> {
  const token = bearerToken(request);
  if (token) return verifyBearerToken(token);

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
      if (!error) return null;
    } catch {
      // Fall through to remote check
    }
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}
