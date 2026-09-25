import { siteUrlFromEnv } from "../build-env";

const DEFAULT_NEXT = "/";
const MAX_NEXT_LENGTH = 512;

export function safeNextPath(raw: string | null | undefined): string {
  if (!raw) return DEFAULT_NEXT;
  if (raw.length > MAX_NEXT_LENGTH) return DEFAULT_NEXT;

  // eslint-disable-next-line no-control-regex -- intentionally matching control chars to reject them
  if (/[\x00-\x1f\x7f]/.test(raw)) return DEFAULT_NEXT;

  if (!raw.startsWith("/")) return DEFAULT_NEXT;
  if (raw.startsWith("//")) return DEFAULT_NEXT;

  // Backslashes are normalised to forward slashes by some browsers, so "/\evil.com"
  // can escape the origin even though it looks relative.
  if (raw.includes("\\")) return DEFAULT_NEXT;

  if (raw === "/auth" || raw.startsWith("/auth/")) return DEFAULT_NEXT;

  return raw;
}

export function resolveOrigin(request: Request): string {
  const configured = siteUrlFromEnv()?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return new URL(request.url).origin;
}

export function buildRedirectUrl(origin: string, path: string, error?: string | null): string {
  const url = new URL(safeNextPath(path), origin);
  if (error) url.searchParams.set("auth_error", error);
  return url.toString();
}
