import { describe, expect, it } from "vitest";
import { parseCookieHeader } from "./cookies";

describe("parseCookieHeader", () => {
  it("returns nothing for a missing or empty header", () => {
    expect(parseCookieHeader(null)).toEqual([]);
    expect(parseCookieHeader(undefined)).toEqual([]);
    expect(parseCookieHeader("")).toEqual([]);
  });

  it("parses a single pair", () => {
    expect(parseCookieHeader("sb-access-token=abc123")).toEqual([
      { name: "sb-access-token", value: "abc123" },
    ]);
  });

  it("parses multiple pairs and trims surrounding whitespace", () => {
    expect(parseCookieHeader("a=1;  b=2 ;c=3")).toEqual([
      { name: "a", value: "1" },
      { name: "b", value: "2" },
      { name: "c", value: "3" },
    ]);
  });

  it("keeps base64 padding in the value instead of splitting on every '='", () => {
    // Supabase auth cookies are base64-encoded JSON, so `=` routinely appears
    // inside the value. Splitting on all separators would truncate the token.
    const header = "sb-project-auth-token=base64-eyJhIjoxfQ==";
    expect(parseCookieHeader(header)).toEqual([
      { name: "sb-project-auth-token", value: "base64-eyJhIjoxfQ==" },
    ]);
  });

  it("handles the chunked auth cookies the ssr client writes for long sessions", () => {
    const parsed = parseCookieHeader("sb-auth-token.0=first;sb-auth-token.1=second");
    expect(parsed.map((c) => c.name)).toEqual(["sb-auth-token.0", "sb-auth-token.1"]);
  });

  it("percent-decodes values", () => {
    expect(parseCookieHeader("redirect=%2Fgame%2FABCDE")).toEqual([
      { name: "redirect", value: "/game/ABCDE" },
    ]);
  });

  it("falls back to the raw value when it cannot be decoded", () => {
    // A stale or hand-edited cookie should not throw and take down the request.
    expect(parseCookieHeader("broken=%E0%A4%A")).toEqual([{ name: "broken", value: "%E0%A4%A" }]);
  });

  it("skips malformed segments with no name or no separator", () => {
    expect(parseCookieHeader("novalue; =orphan; good=1")).toEqual([{ name: "good", value: "1" }]);
  });

  it("preserves empty values", () => {
    expect(parseCookieHeader("cleared=")).toEqual([{ name: "cleared", value: "" }]);
  });
});
