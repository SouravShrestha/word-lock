/**
 * Single landing point for every successful sign-in.
 *
 * Google OAuth and magic links both arrive here, but not always in the same
 * shape, so both are handled:
 *
 *  - `?code=` — the PKCE authorisation code. Used by `signInWithOAuth` and by
 *    magic links when the email template points at `{{ .ConfirmationURL }}`.
 *    Exchanging it needs the code-verifier cookie written by the browser
 *    client, which is why the browser client uses `@supabase/ssr`.
 *  - `?token_hash=&type=` — the one-time token form, used when the email
 *    template is switched to `{{ .TokenHash }}`. Supporting both means the
 *    dashboard's email template config can change without breaking login.
 *
 * On success the session cookies are written and the player is sent back to
 * wherever they started. On failure they land on the same page with an
 * `auth_error` param for the UI to surface, never on a dead end.
 */
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createRouteClient } from "@/integrations/supabase/client.route";
import { buildRedirectUrl, resolveOrigin, safeNextPath } from "@/lib/auth/redirect";

/** Token types we accept from an email link. */
const ALLOWED_OTP_TYPES: EmailOtpType[] = ["magiclink", "email", "signup", "recovery"];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = resolveOrigin(request);
  const next = safeNextPath(url.searchParams.get("next"));

  // The provider itself can report a failure (consent denied, expired link).
  // Its description is untrusted text, so only a fixed code is passed on.
  if (url.searchParams.get("error")) {
    return NextResponse.redirect(buildRedirectUrl(origin, next, "provider_denied"));
  }

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const otpType = url.searchParams.get("type");

  if (!code && !tokenHash) {
    return NextResponse.redirect(buildRedirectUrl(origin, next, "missing_code"));
  }

  const { supabase, applyCookies } = createRouteClient(request);

  try {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        // Overwhelmingly this is a link that was already used or has expired.
        return NextResponse.redirect(buildRedirectUrl(origin, next, "exchange_failed"));
      }
    } else if (tokenHash) {
      if (!otpType || !ALLOWED_OTP_TYPES.includes(otpType as EmailOtpType)) {
        return NextResponse.redirect(buildRedirectUrl(origin, next, "bad_token_type"));
      }
      const { error } = await supabase.auth.verifyOtp({
        type: otpType as EmailOtpType,
        token_hash: tokenHash,
      });
      if (error) {
        return NextResponse.redirect(buildRedirectUrl(origin, next, "verify_failed"));
      }
    }
  } catch {
    // Network trouble reaching the auth server, rather than a bad link.
    return NextResponse.redirect(buildRedirectUrl(origin, next, "unavailable"));
  }

  // applyCookies is what actually persists the new session — without it the
  // exchange succeeds and is then thrown away.
  return applyCookies(NextResponse.redirect(buildRedirectUrl(origin, next)));
}
