import { NextResponse } from "next/server";
import { z } from "zod";
import { submitMove } from "@/lib/game/service.server";
import { callerSchema, resolveCaller, roomCodeSchema } from "@/lib/game/identity.server";

const schema = callerSchema.extend({
  roomCode: roomCodeSchema,
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

    const caller = await resolveCaller(req, parsed.data);
    const result = await submitMove(
      caller,
      parsed.data.roomCode.toUpperCase(),
      parsed.data.word,
      parsed.data.tileIndices,
    );
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 400 });
  }
}
