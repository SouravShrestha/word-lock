import { NextResponse } from "next/server";
import { z } from "zod";
import { loadGame, serializeGame } from "@/lib/game/service.server";

const schema = z.object({
  sessionId: z.string().uuid().optional(),
  roomCode: z.string().min(3).max(12),
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

    const viewerId = sessionId
      ? (loaded.players.find((p) => p.session_id === sessionId)?.id ?? null)
      : null;

    const result = serializeGame(loaded.game, loaded.moves, loaded.players, viewerId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 400 });
  }
}
