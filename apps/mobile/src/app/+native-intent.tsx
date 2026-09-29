/**
 * `expo-router`'s hook for rewriting incoming deep links before they are
 * matched against the route tree.
 *
 * `wordlock://auth/callback` is the Google OAuth redirect (see
 * `lib/auth-adapter.ts`). `openAuthSessionAsync` consumes it and hands the
 * `code` back to the adapter, but on Android the same URL is also delivered to
 * the app as an intent, and the router would navigate to `/auth/callback` — a
 * route that does not exist, so `+not-found` rendered behind the username sheet
 * and stayed there after it closed. The callback is never a destination, so it
 * is swallowed: returning null keeps the current screen, and on a cold start
 * (the OS killed the app while the browser was open) there is no current
 * screen, so it lands on home instead.
 */
const AUTH_CALLBACK = /^(?:wordlock:\/\/)?\/?auth\/callback(?:[/?#]|$)/;

export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}): string | null {
  if (AUTH_CALLBACK.test(path)) return initial ? "/" : null;
  return path;
}
