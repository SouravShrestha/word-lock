import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/http/errors";
import { applyCookies } from "@/integrations/supabase/client.route";
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
    return applyCookies(req, NextResponse.json(result));
  } catch (error) {
    return applyCookies(req, toErrorResponse(error, "api/game/move"));
  }
}
