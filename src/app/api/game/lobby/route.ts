import { NextResponse } from "next/server";
import { listGamesForSession } from "@/lib/game/service.server";
import { callerSchema, resolveCaller } from "@/lib/game/identity.server";

const schema = callerSchema;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const caller = await resolveCaller(req, parsed.data);
    const result = await listGamesForSession(caller);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 400 });
  }
}
