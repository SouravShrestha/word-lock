import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/http/errors";
import { applyCookies } from "@/integrations/supabase/client.route";
import { z } from "zod";

import { sendReaction } from "@/lib/game/service.server";
import { callerSchema, resolveCaller, roomCodeSchema } from "@/lib/game/identity.server";
import { REACTION_EMOJIS } from "@word-lock/core/game";

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
    return applyCookies(req, NextResponse.json(result));
  } catch (error) {
    return applyCookies(req, toErrorResponse(error, "api/game/reaction"));
  }
}
