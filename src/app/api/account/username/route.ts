import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/http/errors";
import { applyCookies } from "@/integrations/supabase/client.route";
import { z } from "zod";

import { setUsername } from "@/lib/account/service.server";
import { MAX_USERNAME_LENGTH } from "@/lib/account/names";
import { callerSchema, resolveCaller } from "@/lib/game/identity.server";

const schema = callerSchema.extend({
  // Length is bounded here only to cap the payload; the real rules live in
  // `validateUsername`, which returns player-facing copy for each failure.
  username: z
    .string()
    .min(1)
    .max(MAX_USERNAME_LENGTH * 2),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const caller = await resolveCaller(req, parsed.data);
    const result = await setUsername(caller, parsed.data.username);
    return applyCookies(req, NextResponse.json(result));
  } catch (error) {
    return applyCookies(req, toErrorResponse(error, "api/account/username"));
  }
}
