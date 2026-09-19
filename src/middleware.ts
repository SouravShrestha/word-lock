/**
 * Refreshes the Supabase auth cookie on every navigation.
 *
 * Access tokens are short-lived. Server Components cannot write cookies, so
 * without a middleware pass the cookie goes stale and a player with a perfectly
 * valid refresh token appears logged out on the server while still looking
 * logged in in the browser. This is the only place that refresh can happen.
 *
 * Runs in the Cloudflare edge runtime (see the `middleware` block in
 * `open-next.config.ts`), so everything here must be edge-safe — no node-only
 * APIs, no importing the service-role client.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Without Supabase configured there is no session to refresh. Passing the
  // request through beats throwing, which would take down every route in the
  // app rather than just the logged-in surfaces.
  if (!url || !anonKey) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        // Written to the request first so anything rendering downstream in this
        // same pass sees the refreshed token, then rebuilt onto a fresh
        // response so the browser is told to store it.
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // This call is the refresh. The user object is deliberately unused here —
  // authorisation decisions belong in the route handlers, where the verified
  // user is resolved again via `getVerifiedUser`.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Page navigations only. Static assets and image optimisation never carry a
     * session worth refreshing, and `/api/game/*` is excluded on purpose: those
     * handlers resolve identity themselves and are hit frequently during play
     * (turn polling every 3s), so adding an auth-server round trip to each one
     * would be pure latency.
     */
    "/((?!_next/static|_next/image|api/game|favicon.ico|robots.txt|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf)$).*)",
  ],
};
