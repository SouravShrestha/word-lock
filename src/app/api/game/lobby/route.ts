import { NextResponse } from "next/server";
import { z } from "zod";
import { listGamesForSession } from "@/lib/game/service.server";

const schema = z.object({
  sessionId: z.string().uuid(),
  displayName: z.string().max(24).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const result = await listGamesForSession(parsed.data.sessionId, parsed.data.displayName);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 400 });
  }
}
