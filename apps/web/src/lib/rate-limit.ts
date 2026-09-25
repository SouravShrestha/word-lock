/**
 * Best-effort, per-isolate rate limiting.
 *
 * Cloudflare Workers isolates are short-lived and this repo has no KV/Durable
 * Object binding configured yet, so this cannot enforce a global limit across
 * edge locations — a determined, distributed attacker can still get around
 * it. What it does stop cheaply is a single script hammering one endpoint
 * from one location (room-code brute-forcing, username enumeration), which is
 * the realistic threat today. Upgrading to a shared KV/Durable-Object counter
 * is a follow-up once a namespace is provisioned in `wrangler.toml`.
 */
import { NextResponse } from "next/server";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Crude guard against unbounded growth on a long-lived isolate; a real
// deployment would use a bounded LRU, but this keeps the module dependency-free.
const MAX_TRACKED_BUCKETS = 5000;

function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/**
 * Returns true if the request is within limit, false if it should be rejected.
 * `limit` requests are allowed per `windowMs` per (bucket, client IP) pair.
 */
export function checkRateLimit(request: Request, bucket: string, limit: number, windowMs: number): boolean {
  const key = `${bucket}:${clientIp(request)}`;
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    if (buckets.size >= MAX_TRACKED_BUCKETS) buckets.clear();
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (existing.count >= limit) return false;
  existing.count += 1;
  return true;
}

export function rateLimitResponse(): NextResponse {
  return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
}
