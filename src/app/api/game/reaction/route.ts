import { NextResponse } from "next/server";
import { z } from "zod";

import { sendReaction } from "@/lib/game/service.server";
import { callerSchema, resolveCaller, roomCodeSchema } from "@/lib/game/identity.server";
import { REACTION_EMOJIS } from "@/lib/game/reactions";

const schema = callerSchema.extend({
  roomCode: roomCodeSchema,
  emoji: z.enum(REACTION_EMOJIS),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const caller = await resolveCaller(req, parsed.data);
    const result = await sendReaction(
      caller,
      parsed.data.roomCode.toUpperCase(),
      parsed.data.emoji,
    );
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 400 });
  }
}
