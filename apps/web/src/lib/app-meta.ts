export {
  AUTHOR_NAME,
  AUTHOR_URL,
  CHANGELOG_URL,
  LICENSE_URL,
  PRIVACY_UPDATED,
  PRIVACY_URL,
  REPO_URL,
  SUPPORT_EMAIL,
  TERMS_URL,
  WORDLIST_URL,
} from "@word-lock/core/app";

import { supportMailtoFor } from "@word-lock/core/app";

export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0";

export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (configured) return configured;
  return typeof window === "undefined" ? "" : window.location.origin;
}

export function supportMailto(subject = "Word lock support"): string {
  return supportMailtoFor({
    version: APP_VERSION,
    device: typeof navigator === "undefined" ? "unknown" : navigator.userAgent,
    subject,
  });
}
