import { NextResponse } from "next/server";

import { getAccountSummary } from "@/lib/account/service.server";
import { callerSchema, resolveCaller } from "@/lib/game/identity.server";

const schema = callerSchema;

/**
 * Account state for the profile screen and the username prompt.
 *
 * A POST despite being a read, because it needs the guest session id from the
 * body to resolve a player row for callers who are not logged in.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const caller = await resolveCaller(req, parsed.data);
    const result = await getAccountSummary(caller);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 400 });
  }
}
