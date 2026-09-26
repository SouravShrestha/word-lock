import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/http/errors";
import { applyCookies } from "@/integrations/supabase/client.route";
import { joinGame } from "@/lib/game/service.server";
import { callerSchema, resolveCaller, roomCodeSchema } from "@/lib/game/identity.server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const schema = callerSchema.extend({ roomCode: roomCodeSchema });

export async function POST(req: Request) {
  if (!checkRateLimit(req, "game-join", 15, 60_000)) return rateLimitResponse();

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const caller = await resolveCaller(req, parsed.data);
    const result = await joinGame(caller, parsed.data.roomCode.toUpperCase());
    return applyCookies(req, NextResponse.json(result));
  } catch (error) {
    return applyCookies(req, toErrorResponse(error, "api/game/join"));
  }
}
