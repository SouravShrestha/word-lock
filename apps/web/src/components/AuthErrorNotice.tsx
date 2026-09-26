"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

/**
 * Surfaces a failed login.
 *
 * `/auth/callback` cannot render anything — it only redirects — so it reports
 * failures by putting an `auth_error` code on the destination URL. This picks
 * that up, explains it, and strips the param so a refresh or a shared link does
 * not resurface a stale error.
 */

const MESSAGES: Record<string, string> = {
  provider_denied: "Login was cancelled.",
  missing_code: "That login link was incomplete. Try again.",
  exchange_failed: "That login link has expired or was already used.",
  verify_failed: "That login link has expired or was already used.",
  bad_token_type: "That login link isn't valid.",
  unavailable: "Couldn't reach the login service. Try again in a moment.",
};

const FALLBACK = "Login didn't complete. Try again.";

export function AuthErrorNotice() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const code = searchParams.get("auth_error");

  // React can run effects twice in development; without this the player sees
  // the same toast stacked.
  const shown = useRef<string | null>(null);

  useEffect(() => {
    if (!code || shown.current === code) return;
    shown.current = code;

    toast.error(MESSAGES[code] ?? FALLBACK);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("auth_error");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [code, pathname, router, searchParams]);

  return null;
}
