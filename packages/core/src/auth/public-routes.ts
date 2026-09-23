const PUBLIC_PREFIXES = ["/legal", "/how-to-play"] as const;

export function isPublicRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
