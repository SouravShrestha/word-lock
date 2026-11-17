import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client.server", () => ({
  getSupabaseAdmin: () => ({
    auth: {
      admin: {
        generateLink: async () => ({ data: { properties: { hashed_token: "h" } }, error: null }),
      },
    },
  }),
}));

import { POST } from "./route";

const call = (body: unknown) =>
  POST(
    new Request("http://x/api/auth/review-login", { method: "POST", body: JSON.stringify(body) }),
  );

afterEach(() => {
  delete process.env.REVIEW_LOGIN_EMAIL;
  delete process.env.REVIEW_LOGIN_CODE;
});

describe("review-login", () => {
  it("is off without both secrets", async () => {
    process.env.REVIEW_LOGIN_EMAIL = "r@x.dev";
    expect((await call({ email: "r@x.dev", code: "" })).status).toBe(404);
  });

  it("rejects a wrong code", async () => {
    process.env.REVIEW_LOGIN_EMAIL = "r@x.dev";
    process.env.REVIEW_LOGIN_CODE = "123456";
    expect((await call({ email: "r@x.dev", code: "654321" })).status).toBe(404);
  });

  it("returns a token hash for the right pair", async () => {
    process.env.REVIEW_LOGIN_EMAIL = "r@x.dev";
    process.env.REVIEW_LOGIN_CODE = "123456";
    const res = await call({ email: " R@x.dev ", code: "123456" });
    expect(await res.json()).toEqual({ tokenHash: "h" });
  });
});
