import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createRouteClient } from "@/integrations/supabase/client.route";
import { buildRedirectUrl, resolveOrigin, safeNextPath } from "@word-lock/core/auth";

const ALLOWED_OTP_TYPES: EmailOtpType[] = ["magiclink", "email", "signup", "recovery"];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = resolveOrigin(request);
  const next = safeNextPath(url.searchParams.get("next"));

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
    return NextResponse.redirect(buildRedirectUrl(origin, next, "unavailable"));
  }

  return applyCookies(NextResponse.redirect(buildRedirectUrl(origin, next)));
}
