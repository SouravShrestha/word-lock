import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/http/errors";
import { applyCookies } from "@/integrations/supabase/client.route";
import { z } from "zod";
import { forfeitGame } from "@/lib/game/service.server";
import { callerSchema, resolveCaller } from "@/lib/game/identity.server";

const schema = callerSchema.extend({ roomCode: z.string().min(3) });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const caller = await resolveCaller(req, parsed.data);
    const result = await forfeitGame(caller, parsed.data.roomCode);
    return applyCookies(req, NextResponse.json(result));
  } catch (error) {
    return applyCookies(req, toErrorResponse(error, "api/game/forfeit"));
  }
}
