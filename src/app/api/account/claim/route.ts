/**
 * Links the caller's account to the guest identity in this browser, merging the
 * two players' history when the account already has one.
 *
 * Called by the client immediately after a sign-in. It has to be a separate
 * endpoint rather than part of `/auth/callback` because the guest session id
 * lives in localStorage, which the server cannot read.
 *
 * Idempotent: repeat calls after the first are no-ops, so it is safe to fire on
 * every `SIGNED_IN` event and on page load.
 */
import { NextResponse } from "next/server";
import { z } from "zod";

import { getVerifiedUser } from "@/integrations/supabase/client.route";
import { claimGuestHistory } from "@/lib/game/identity.server";

const schema = z.object({
  sessionId: z.string().uuid(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    /*
     * The account side of this is verified. The guest side is not — anyone who
     * knows a session id could pull that guest's games into their own account.
     * That is the same exposure the session id has always carried (knowing it
     * already lets you play as that guest), and migration 004 closed the way to
     * harvest ids in bulk by dropping the anon read policy on wl_players.
     */
    const user = await getVerifiedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const playerId = await claimGuestHistory(user.id, parsed.data.sessionId);
    return NextResponse.json({ playerId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 400 });
  }
}
