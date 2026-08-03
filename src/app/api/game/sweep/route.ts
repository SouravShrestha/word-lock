import { NextResponse } from "next/server";
import { sweepExpiredTurns } from "@/lib/game/service.server";

function isAuthorized(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  return req.headers.get("Authorization") === `Bearer ${cronSecret}`;
}

async function runSweep(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await sweepExpiredTurns();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export const GET = runSweep;
export const POST = runSweep;
