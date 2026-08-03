import { NextResponse } from "next/server";
import { z } from "zod";
import { forfeitGame } from "@/lib/game/service.server";

const schema = z.object({
  sessionId: z.string().uuid(),
  roomCode: z.string().min(3),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const result = await forfeitGame(parsed.data.sessionId, parsed.data.roomCode);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 400 });
  }
}
