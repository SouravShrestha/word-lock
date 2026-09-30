import { NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/http/errors";
import { applyCookies } from "@/integrations/supabase/client.route";
import { createGame } from "@/lib/game/service.server";
import { callerSchema, resolveCaller } from "@/lib/game/identity.server";
import { DEFAULT_TIME_CONTROL, TIME_CONTROL_IDS } from "@word-lock/core/game";

const schema = callerSchema.extend({
  timeControl: z.enum(TIME_CONTROL_IDS).default(DEFAULT_TIME_CONTROL),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const caller = await resolveCaller(req, parsed.data);
    const result = await createGame(caller, parsed.data.timeControl);
    return applyCookies(req, NextResponse.json(result));
  } catch (error) {
    return applyCookies(req, toErrorResponse(error, "api/game/create"));
  }
}
