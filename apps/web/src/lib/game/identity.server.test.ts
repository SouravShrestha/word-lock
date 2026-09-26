import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getVerifiedUserMock = vi.fn(async (..._args: any[]) => null as { id: string } | null);
const queueCookieMock = vi.fn();

vi.mock("@/integrations/supabase/client.route", () => ({
  getVerifiedUser: (...args: any[]) => getVerifiedUserMock(...args),
  queueCookie: (...args: any[]) => queueCookieMock(...args),
}));

let players: Array<{ id: string; session_id: string }>;

vi.mock("@/integrations/supabase/client.server", () => ({
  getSupabaseAdmin: () => ({
    from: () => ({
      select: () => ({
        eq: (_column: string, value: string) => ({
          maybeSingle: async () => ({
            data: players.find((p) => p.session_id === value) ?? null,
            error: null,
          }),
        }),
      }),
    }),
  }),
}));

const ORIGINAL_ENV = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  guestSecret: process.env.GUEST_COOKIE_SECRET,
};

beforeEach(() => {
  players = [];
  getVerifiedUserMock.mockReset().mockResolvedValue(null);
  queueCookieMock.mockReset();
  process.env.NEXT_PUBLIC_SITE_URL = "https://wordlock.example";
  delete process.env.GUEST_COOKIE_SECRET;
});

afterEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL_ENV.siteUrl;
  process.env.GUEST_COOKIE_SECRET = ORIGINAL_ENV.guestSecret;
});

const SESSION_ID = "11111111-1111-1111-1111-111111111111";

function requestWith(options: { origin?: string; cookie?: string } = {}) {
  const headers: Record<string, string> = {};
  if (options.origin) headers.origin = options.origin;
  if (options.cookie) headers.cookie = options.cookie;
  return new Request("https://wordlock.example/api/game/join", { headers });
}

describe("resolveCaller — same-origin check", () => {
  it("allows a request with no Origin header", async () => {
    const { resolveCaller } = await import("./identity.server");
    await expect(resolveCaller(requestWith(), { sessionId: SESSION_ID })).resolves.toMatchObject({
      sessionId: SESSION_ID,
    });
  });

  it("allows a same-origin request", async () => {
    const { resolveCaller } = await import("./identity.server");
    await expect(
      resolveCaller(requestWith({ origin: "https://wordlock.example" }), {
        sessionId: SESSION_ID,
      }),
    ).resolves.toMatchObject({ sessionId: SESSION_ID });
  });

  it("rejects a cross-origin request", async () => {
    const { resolveCaller } = await import("./identity.server");
    await expect(
      resolveCaller(requestWith({ origin: "https://evil.example" }), { sessionId: SESSION_ID }),
    ).rejects.toThrow("Cross-origin request rejected.");
  });
});

describe("resolveCaller — guest cookie binding", () => {
  it("is a no-op when GUEST_COOKIE_SECRET isn't configured", async () => {
    players = [{ id: "p1", session_id: SESSION_ID }];
    const { resolveCaller } = await import("./identity.server");

    await resolveCaller(requestWith({ cookie: "wl_guest_bind=garbage" }), {
      sessionId: SESSION_ID,
    });

    expect(queueCookieMock).not.toHaveBeenCalled();
  });

  it("binds and allows a brand-new session with no prior cookie", async () => {
    process.env.GUEST_COOKIE_SECRET = "test-secret";
    const { resolveCaller } = await import("./identity.server");

    await resolveCaller(requestWith(), { sessionId: SESSION_ID });

    expect(queueCookieMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ name: "wl_guest_bind" }),
    );
  });

  it("does not reject a fresh session id even if the browser has a stale, mismatched cookie", async () => {
    process.env.GUEST_COOKIE_SECRET = "test-secret";
    const { resolveCaller } = await import("./identity.server");

    // No `players` row for SESSION_ID yet — this is a brand-new guest session
    // (e.g. right after sign-out) sharing a browser with an old cookie.
    await expect(
      resolveCaller(requestWith({ cookie: "wl_guest_bind=not-the-right-value" }), {
        sessionId: SESSION_ID,
      }),
    ).resolves.toMatchObject({ sessionId: SESSION_ID });
  });

  it("allows an existing guest session with no cookie at all (mobile, or a cleared cookie)", async () => {
    process.env.GUEST_COOKIE_SECRET = "test-secret";
    players = [{ id: "p1", session_id: SESSION_ID }];
    const { resolveCaller } = await import("./identity.server");

    await expect(resolveCaller(requestWith(), { sessionId: SESSION_ID })).resolves.toMatchObject({
      sessionId: SESSION_ID,
    });
  });

  it("allows an existing guest session whose cookie matches", async () => {
    process.env.GUEST_COOKIE_SECRET = "test-secret";
    players = [{ id: "p1", session_id: SESSION_ID }];
    const valid = createHmac("sha256", "test-secret").update(SESSION_ID).digest("hex");
    const { resolveCaller } = await import("./identity.server");

    await expect(
      resolveCaller(requestWith({ cookie: `wl_guest_bind=${valid}` }), { sessionId: SESSION_ID }),
    ).resolves.toMatchObject({ sessionId: SESSION_ID });
  });

  it("rejects an existing guest session whose cookie belongs to a different session", async () => {
    process.env.GUEST_COOKIE_SECRET = "test-secret";
    players = [{ id: "p1", session_id: SESSION_ID }];
    const someoneElses = createHmac("sha256", "test-secret").update("other-session").digest("hex");
    const { resolveCaller } = await import("./identity.server");

    await expect(
      resolveCaller(requestWith({ cookie: `wl_guest_bind=${someoneElses}` }), {
        sessionId: SESSION_ID,
      }),
    ).rejects.toThrow("This session doesn't belong to this browser.");
  });

  it("never binds an empty sessionId (the api/game/fetch spectator case)", async () => {
    process.env.GUEST_COOKIE_SECRET = "test-secret";
    const { resolveCaller } = await import("./identity.server");

    await resolveCaller(requestWith({ cookie: "wl_guest_bind=garbage" }), { sessionId: "" });

    expect(queueCookieMock).not.toHaveBeenCalled();
  });
});
