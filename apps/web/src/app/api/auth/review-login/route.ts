import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdmin } from "@/integrations/supabase/client.server";
import { toErrorResponse } from "@/lib/http/errors";

/**
 * Store-review login: a fixed email + code that signs in one account without
 * an inbox. Off unless REVIEW_LOGIN_EMAIL and REVIEW_LOGIN_CODE are set, which
 * they only are as production secrets (`wrangler secret put --env production`).
 * Returns a magic-link token hash; the app turns it into a session with
 * `verifyOtp({ token_hash, type: "email" })`, so no service-role key leaves
 * the server.
 */
const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().trim().min(1).max(32),
});

const digest = (s: string) => createHash("sha256").update(s).digest();
const same = (a: string, b: string) => timingSafeEqual(digest(a), digest(b));

export async function POST(req: Request) {
  const email = process.env.REVIEW_LOGIN_EMAIL?.trim().toLowerCase();
  const code = process.env.REVIEW_LOGIN_CODE?.trim();
  if (!email || !code) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const parsed = schema.safeParse(await req.json());
    // Evaluate both comparisons so timing doesn't reveal which half was wrong.
    const ok =
      parsed.success &&
      [same(parsed.data.email, email), same(parsed.data.code, code)].every(Boolean);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data, error } = await getSupabaseAdmin().auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (error) throw error;
    return NextResponse.json({ tokenHash: data.properties.hashed_token });
  } catch (error) {
    return toErrorResponse(error, "api/auth/review-login");
  }
}
