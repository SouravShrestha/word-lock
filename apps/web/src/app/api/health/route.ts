import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/integrations/supabase/client.server";
import { log } from "@/lib/log";

export async function GET() {
  try {
    const { error } = await getSupabaseAdmin()
      .from("wl_games")
      .select("id", { head: true })
      .limit(1);
    if (error) throw new Error(error.message);

    return NextResponse.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    log.error("Health check failed", {
      context: "api/health",
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { status: "error" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
