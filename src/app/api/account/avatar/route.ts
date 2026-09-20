import { NextResponse } from "next/server";
import { z } from "zod";

import { setAvatar } from "@/lib/account/service.server";
import { callerSchema, resolveCaller } from "@/lib/game/identity.server";

const schema = callerSchema.extend({
  // Shape only. Which ids actually exist is `isAvatarId`'s business, checked in
  // `setAvatar` so the player gets copy rather than a bare 400.
  avatar: z.string().min(1).max(32),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const caller = await resolveCaller(req, parsed.data);
    const result = await setAvatar(caller, parsed.data.avatar);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 400 });
  }
}
