/**
 * The one place a caught error becomes an HTTP response.
 *
 * Every route handler used to do `catch (error: any) { ... error.message }`,
 * which reaches into the client's response no matter where the error came
 * from — a deliberate `throw new Error("It's not your turn yet.")` and a raw
 * Postgres constraint message get the exact same treatment. That leaks
 * schema and internal-service detail (column names, constraint names,
 * connection failures) to anyone hitting the API, and turns a database outage
 * into a 400 the client could reasonably retry.
 *
 * `PublicError` marks the messages that are *meant* to reach the client —
 * every validation and business-rule throw already in `service.server.ts`,
 * `identity.server.ts` and `account/service.server.ts` — everything else is
 * logged server-side and collapsed into a generic message.
 */
import { NextResponse } from "next/server";
import { log } from "@/lib/log";

/** An error whose message is safe to show the caller as-is. */
export class PublicError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "PublicError";
    this.status = status;
  }
}

const GENERIC_MESSAGE = "Something went wrong. Please try again.";

/**
 * Converts a caught error into a `NextResponse`. `PublicError` messages (and
 * their status) go straight to the client; anything else is logged with
 * `context` for server-side diagnosis and replaced with a generic 500.
 *
 * Returns a `NextResponse` rather than a plain `Response` specifically so the
 * result can still be passed through `applyCookies` — an auth token refresh
 * discovered while resolving the caller should reach the browser even when
 * the request goes on to fail.
 */
export function toErrorResponse(error: unknown, context: string): NextResponse {
  if (error instanceof PublicError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  log.error("Unhandled route error", {
    context,
    error: error instanceof Error ? error.message : String(error),
  });
  return NextResponse.json({ error: GENERIC_MESSAGE }, { status: 500 });
}
