import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { toErrorResponse } from "@/lib/http/errors";
import { sweepExpiredTurns } from "@/lib/game/service.server";

/**
 * Fails closed: without `CRON_SECRET` configured, this endpoint is
 * unauthenticated and unauthorized rather than open to the world. Cloudflare's
 * scheduled trigger (see `src/worker.ts`) and the CI/deploy environments must
 * set the same secret, or every sweep call will 503.
 */
function isAuthorized(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const expected = `Bearer ${cronSecret}`;
  const provided = req.headers.get("Authorization") ?? "";
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);
  if (expectedBuf.length !== providedBuf.length) return false;

  return timingSafeEqual(expectedBuf, providedBuf);
}

async function runSweep(req: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Sweep is not configured." }, { status: 503 });
  }
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await sweepExpiredTurns();
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error, "api/game/sweep");
  }
}

export const GET = runSweep;
export const POST = runSweep;
