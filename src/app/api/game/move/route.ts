import { NextResponse } from "next/server";
import { z } from "zod";
import { submitMove } from "@/lib/game/service.server";

const schema = z.object({
  sessionId: z.string().uuid(),
  roomCode: z.string().min(3).max(12),
  word: z.string().min(3).max(25),
  tileIndices: z.array(z.number().int().min(0).max(24)).min(3).max(25),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const result = await submitMove(
      parsed.data.sessionId,
      parsed.data.roomCode.toUpperCase(),
      parsed.data.word,
      parsed.data.tileIndices,
    );
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 400 });
  }
}
