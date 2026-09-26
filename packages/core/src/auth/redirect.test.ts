import { afterEach, describe, expect, it } from "vitest";
import { buildRedirectUrl, resolveOrigin, safeNextPath } from "./redirect";

describe("safeNextPath", () => {
  it("defaults to home when missing or empty", () => {
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath(undefined)).toBe("/");
    expect(safeNextPath("")).toBe("/");
  });

  it("allows root-relative in-app paths, including query and hash", () => {
    expect(safeNextPath("/")).toBe("/");
    expect(safeNextPath("/game/ABCDE")).toBe("/game/ABCDE");
    expect(safeNextPath("/profile?tab=stats")).toBe("/profile?tab=stats");
    expect(safeNextPath("/leaderboard#top")).toBe("/leaderboard#top");
  });

  it("rejects absolute URLs", () => {
    expect(safeNextPath("https://evil.example.com")).toBe("/");
    expect(safeNextPath("http://evil.example.com/path")).toBe("/");
    expect(safeNextPath("javascript:alert(1)")).toBe("/");
  });

  it("rejects protocol-relative URLs", () => {
    // "//evil.com" is a valid absolute URL to a browser despite looking relative.
    expect(safeNextPath("//evil.example.com")).toBe("/");
    expect(safeNextPath("//evil.example.com/game")).toBe("/");
  });

  it("rejects backslash escapes that some browsers normalise to slashes", () => {
    expect(safeNextPath("/\\evil.example.com")).toBe("/");
    expect(safeNextPath("\\\\evil.example.com")).toBe("/");
  });

  it("rejects bare hosts and other non-relative values", () => {
    expect(safeNextPath("evil.example.com")).toBe("/");
    expect(safeNextPath("game/ABCDE")).toBe("/");
  });

  it("rejects control characters used for header injection", () => {
    expect(safeNextPath("/game\nLocation: https://evil.example.com")).toBe("/");
    expect(safeNextPath("/game\r\nSet-Cookie: a=b")).toBe("/");
    expect(safeNextPath("/game\u0000")).toBe("/");
  });

  it("rejects paths that bounce back into the auth routes", () => {
    expect(safeNextPath("/auth")).toBe("/");
    expect(safeNextPath("/auth/callback")).toBe("/");
    expect(safeNextPath("/auth/callback?code=stale")).toBe("/");
  });

  it("rejects absurdly long values", () => {
    expect(safeNextPath(`/${"a".repeat(600)}`)).toBe("/");
  });
});

describe("resolveOrigin", () => {
  const original = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = original;
  });

  it("prefers the configured site URL and strips trailing slashes", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://wordlock.cbsdev.me/";
    const request = new Request("https://whatever.example.com/auth/callback");
    expect(resolveOrigin(request)).toBe("https://wordlock.cbsdev.me");
  });

  it("ignores caller-controlled forwarding headers", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://wordlock.cbsdev.me";
    const request = new Request("https://wordlock.cbsdev.me/auth/callback", {
      headers: { "x-forwarded-host": "evil.example.com" },
    });
    expect(resolveOrigin(request)).toBe("https://wordlock.cbsdev.me");
  });

  it("falls back to the request origin when unset", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const request = new Request("http://localhost:3000/auth/callback?code=abc");
    expect(resolveOrigin(request)).toBe("http://localhost:3000");
  });
});

describe("buildRedirectUrl", () => {
  it("joins origin and path", () => {
    expect(buildRedirectUrl("https://wordlock.cbsdev.me", "/profile")).toBe(
      "https://wordlock.cbsdev.me/profile",
    );
  });

  it("sanitises the path it is given", () => {
    expect(buildRedirectUrl("https://wordlock.cbsdev.me", "//evil.example.com")).toBe(
      "https://wordlock.cbsdev.me/",
    );
  });

  it("appends an auth_error param when one is supplied", () => {
    const url = new URL(
      buildRedirectUrl("https://wordlock.cbsdev.me", "/game/ABCDE", "exchange_failed"),
    );
    expect(url.pathname).toBe("/game/ABCDE");
    expect(url.searchParams.get("auth_error")).toBe("exchange_failed");
  });

  it("preserves an existing query string alongside the error", () => {
    const url = new URL(
      buildRedirectUrl("https://wordlock.cbsdev.me", "/profile?tab=stats", "expired"),
    );
    expect(url.searchParams.get("tab")).toBe("stats");
    expect(url.searchParams.get("auth_error")).toBe("expired");
  });
});
