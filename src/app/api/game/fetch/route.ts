import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/http/errors";
import { applyCookies } from "@/integrations/supabase/client.route";
import { z } from "zod";
import { findViewerId, loadGame, serializeGame } from "@/lib/game/service.server";
import { resolveCaller, roomCodeSchema } from "@/lib/game/identity.server";

// sessionId is optional here, unlike the mutation endpoints: this is the one
// read path that serves spectators, who have no session of their own yet.
const schema = z.object({
  sessionId: z.string().uuid().optional(),
  roomCode: roomCodeSchema,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const { sessionId, roomCode } = parsed.data;
    const loaded = await loadGame(roomCode.toUpperCase());

    if (!loaded) return NextResponse.json(null);

    const caller = await resolveCaller(req, { sessionId: sessionId ?? "" });
    const viewerId = findViewerId(loaded.players, caller);

    const result = serializeGame(loaded.game, loaded.moves, loaded.players, viewerId);
    return applyCookies(req, NextResponse.json(result));
  } catch (error) {
    return applyCookies(req, toErrorResponse(error, "api/game/fetch"));
  }
}
