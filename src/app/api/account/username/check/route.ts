/**
 * Availability check for the username picker, called as the player types.
 *
 * A GET because it changes nothing, and it deliberately needs no identity: it
 * only reveals whether a name is free, which is already visible on the
 * leaderboard. `no-store` keeps a stale "available" out of any cache between the
 * check and the claim.
 */
import { NextResponse } from "next/server";

import { checkUsernameAvailable } from "@/lib/account/service.server";
import { MAX_USERNAME_LENGTH } from "@/lib/account/names";

export async function GET(req: Request) {
  try {
    const raw = new URL(req.url).searchParams.get("u") ?? "";

    if (raw.length > MAX_USERNAME_LENGTH * 2) {
      return NextResponse.json({ available: false, reason: "Too long." });
    }

    const result = await checkUsernameAvailable(raw);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 400 });
  }
}
