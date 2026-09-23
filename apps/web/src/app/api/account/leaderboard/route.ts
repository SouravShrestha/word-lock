/**
 * Public leaderboard.
 *
 * A plain GET: the board itself is public, and the viewer's own standing comes
 * from the verified session cookie rather than anything the caller sends.
 * Guests get the list with `me: null`.
 *
 * Which league the board shows is decided server-side from the viewer's own
 * star count, so a caller cannot ask to be ranked inside a band they are not in.
 */
import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/http/errors";

import { applyCookies, getVerifiedUser } from "@/integrations/supabase/client.route";
import { getLeaderboard } from "@/lib/account/leaderboard.server";

export async function GET(req: Request) {
  try {
    const user = await getVerifiedUser(req);
    const result = await getLeaderboard(user?.id ?? null);
    return applyCookies(
      req,
      NextResponse.json(result, { headers: { "Cache-Control": "no-store" } }),
    );
  } catch (error) {
    return applyCookies(req, toErrorResponse(error, "api/account/leaderboard"));
  }
}
