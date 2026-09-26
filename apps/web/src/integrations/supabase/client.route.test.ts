/**
 * `getVerifiedUser` is the single function every game and account mutation
 * trusts to say who is making a request. Since Task 5, it accepts two
 * completely different kinds of credential — a session cookie (web) and an
 * `Authorization: Bearer` token (mobile) — and this is the one place that
 * decides between them. A mistake here resolves one player as another, so
 * this file is deliberately exhaustive: every combination of "credential
 * present / absent / valid / forged / expired" that the function's own
 * documentation claims to handle gets a case.
 *
 * `@supabase/ssr`'s `createServerClient` is mocked at the module boundary
 * rather than hit for real, because what is under test is `client.route.ts`'s
 * own branching — which credential wins, what happens on failure, whether the
 * cookie jar gets touched — not Supabase's token verification itself.
 */
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
});

afterAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = ORIGINAL_ENV.url;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ORIGINAL_ENV.anonKey;
});

/**
 * A minimal stand-in for the Supabase client `createServerClient` returns.
 * Each test configures exactly the two entry points `client.route.ts` calls:
 * `getClaims` (the fast, local-verification path) and `getUser` (the remote
 * fallback, and the only path bearer verification uses at all — see the note
 * on why `verifyBearerToken` skips `getClaims` in the "no getClaims" cases
 * instead of asserting it is never called: this fake intentionally supports
 * both so the same fake serves every scenario).
 */
function fakeAuthClient(overrides: {
  getClaims?: (
    jwt?: string,
  ) => Promise<{ data: { claims?: { sub?: string } } | null; error: unknown }>;
  getUser?: (jwt?: string) => Promise<{ data: { user: { id: string } | null }; error: unknown }>;
}) {
  return {
    auth: {
      getClaims: overrides.getClaims,
      getUser: overrides.getUser ?? (async () => ({ data: { user: null }, error: null })),
    },
  };
}

const createServerClientMock = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: (...args: unknown[]) => createServerClientMock(...args),
}));

async function loadModule() {
  vi.resetModules();
  return import("./client.route");
}

function requestWith(headers: Record<string, string>): Request {
  return new Request("https://app.example/api/game/move", { headers });
}

describe("getVerifiedUser — bearer token path", () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
  });

  it("resolves a valid bearer token via getClaims, with no network round trip", async () => {
    const getClaims = vi.fn(async () => ({ data: { claims: { sub: "user-1" } }, error: null }));
    const getUser = vi.fn();
    createServerClientMock.mockReturnValue(fakeAuthClient({ getClaims, getUser }));

    const { getVerifiedUser } = await loadModule();
    const result = await getVerifiedUser(requestWith({ Authorization: "Bearer good.jwt.token" }));

    expect(result).toEqual({ id: "user-1" });
    expect(getClaims).toHaveBeenCalledWith("good.jwt.token");
    expect(getUser).not.toHaveBeenCalled();
  });

  it("resolves as a guest for an expired bearer token, not as someone else", async () => {
    const getClaims = vi.fn(async () => ({
      data: { claims: undefined },
      error: { message: "expired" },
    }));
    createServerClientMock.mockReturnValue(fakeAuthClient({ getClaims }));

    const { getVerifiedUser } = await loadModule();
    const result = await getVerifiedUser(requestWith({ Authorization: "Bearer expired.jwt" }));

    expect(result).toBeNull();
  });

  it("resolves as a guest for a forged/tampered signature, not as someone else", async () => {
    // A tampered token fails signature verification: getClaims reports an
    // error rather than a claims object, exactly like an expired one does.
    const getClaims = vi.fn(async () => ({ data: null, error: { message: "invalid signature" } }));
    createServerClientMock.mockReturnValue(fakeAuthClient({ getClaims }));

    const { getVerifiedUser } = await loadModule();
    const result = await getVerifiedUser(requestWith({ Authorization: "Bearer forged.jwt.here" }));

    expect(result).toBeNull();
  });

  it("falls back to the remote getUser(token) check when getClaims is unavailable", async () => {
    // Feature-detection path: an older supabase-js with no getClaims at all.
    const getUser = vi.fn(async () => ({ data: { user: { id: "user-2" } }, error: null }));
    createServerClientMock.mockReturnValue(fakeAuthClient({ getClaims: undefined, getUser }));

    const { getVerifiedUser } = await loadModule();
    const result = await getVerifiedUser(requestWith({ Authorization: "Bearer some.jwt" }));

    expect(result).toEqual({ id: "user-2" });
    expect(getUser).toHaveBeenCalledWith("some.jwt");
  });

  it("falls back to the remote check when getClaims throws unexpectedly", async () => {
    const getClaims = vi.fn(async () => {
      throw new Error("unexpected shape");
    });
    const getUser = vi.fn(async () => ({ data: { user: { id: "user-3" } }, error: null }));
    createServerClientMock.mockReturnValue(fakeAuthClient({ getClaims, getUser }));

    const { getVerifiedUser } = await loadModule();
    const result = await getVerifiedUser(requestWith({ Authorization: "Bearer some.jwt" }));

    expect(result).toEqual({ id: "user-3" });
  });

  it("resolves as a guest when the remote fallback also rejects the token", async () => {
    const getUser = vi.fn(async () => ({ data: { user: null }, error: { message: "invalid" } }));
    createServerClientMock.mockReturnValue(fakeAuthClient({ getClaims: undefined, getUser }));

    const { getVerifiedUser } = await loadModule();
    const result = await getVerifiedUser(requestWith({ Authorization: "Bearer bad.jwt" }));

    expect(result).toBeNull();
  });

  it("treats a malformed Authorization header as no bearer credential, falling through to the cookie path", async () => {
    // No cookie either, so getClaims (the cookie path's own call) reports a
    // real guest — the point being that the header's contents never reach
    // Supabase as a token at all.
    const getClaims = vi.fn(async () => ({ data: { claims: undefined }, error: null }));
    createServerClientMock.mockReturnValue(fakeAuthClient({ getClaims }));

    const { getVerifiedUser } = await loadModule();

    // Missing scheme, wrong scheme, and an empty token after "Bearer " must all
    // fall through to the cookie path rather than being handed to Supabase as
    // a bearer credential.
    for (const header of ["not-a-bearer-token", "Basic dXNlcjpwYXNz", "Bearer "]) {
      const result = await getVerifiedUser(requestWith({ Authorization: header }));
      expect(result).toBeNull();
    }
    // Every call is the cookie path's own no-argument form — none of the three
    // malformed headers was ever passed to getClaims as a token.
    for (const call of getClaims.mock.calls) {
      expect(call).toEqual([]);
    }
  });

  /**
   * `Bearer` is case-sensitive here on purpose (see the doc comment on
   * `bearerToken`), so this pins that choice down rather than letting a future
   * "helpful" fix silently widen it.
   */
  it("does not accept a lowercase bearer scheme, and falls through to the cookie path instead", async () => {
    const getClaims = vi.fn(async () => ({ data: { claims: undefined }, error: null }));
    createServerClientMock.mockReturnValue(fakeAuthClient({ getClaims }));

    const { getVerifiedUser } = await loadModule();
    const result = await getVerifiedUser(requestWith({ authorization: "bearer good.jwt" }));

    expect(result).toBeNull();
    // Called once, by the cookie path, with no token argument — "bearer" in
    // lowercase was never recognised as a credential and never reached
    // Supabase as one.
    expect(getClaims).toHaveBeenCalledTimes(1);
    expect(getClaims).toHaveBeenCalledWith();
  });

  it("builds the bearer verifier with no cookie adapter — nothing for it to read or write", async () => {
    const getClaims = vi.fn(async () => ({ data: { claims: { sub: "user-1" } }, error: null }));
    createServerClientMock.mockReturnValue(fakeAuthClient({ getClaims }));

    const { getVerifiedUser } = await loadModule();
    await getVerifiedUser(
      requestWith({ Authorization: "Bearer good.jwt", cookie: "sb-token=abc" }),
    );

    const [, , options] = createServerClientMock.mock.calls[0] as [
      string,
      string,
      { cookies: { getAll: () => unknown[]; setAll: (v: unknown[]) => void } },
    ];
    expect(options.cookies.getAll()).toEqual([]);
    // Calling setAll must not throw — it is a deliberate no-op, not an
    // oversight, since a bearer caller has nothing to refresh.
    expect(() => options.cookies.setAll([])).not.toThrow();
  });
});

describe("getVerifiedUser — bearer wins when both credentials are present", () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
  });

  /*
   * A request carrying both a bearer token and a stale or unrelated cookie
   * must resolve by the bearer token alone. Falling back to the cookie for
   * *identity* after already having a credential would let a stale cookie
   * silently override the credential the caller actually meant to use — the
   * one hazard this whole task exists to close off.
   */
  it("resolves by the bearer token and never constructs a cookie-reading client", async () => {
    const bearerClaims = vi.fn(async () => ({
      data: { claims: { sub: "bearer-user" } },
      error: null,
    }));
    createServerClientMock.mockImplementation((_url, _key, options) => {
      // The bearer verifier is built with an empty cookie adapter (see the test
      // above); the cookie-path client passes the *request's* cookie header
      // through parseCookieHeader. Distinguishing them here proves only one
      // client — the bearer one — is ever constructed for this request.
      const cookies = options.cookies.getAll();
      if (cookies.length > 0) {
        throw new Error(
          "a cookie-reading client must not be constructed when a bearer token is present",
        );
      }
      return fakeAuthClient({ getClaims: bearerClaims });
    });

    const { getVerifiedUser } = await loadModule();
    const result = await getVerifiedUser(
      requestWith({
        Authorization: "Bearer good.jwt",
        cookie: "sb-project-auth-token=someone-elses-session",
      }),
    );

    expect(result).toEqual({ id: "bearer-user" });
  });
});

describe("getVerifiedUser — cookie path, unchanged", () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
  });

  it("resolves a valid session cookie via getClaims", async () => {
    const getClaims = vi.fn(async () => ({
      data: { claims: { sub: "cookie-user" } },
      error: null,
    }));
    createServerClientMock.mockReturnValue(fakeAuthClient({ getClaims }));

    const { getVerifiedUser } = await loadModule();
    const result = await getVerifiedUser(requestWith({ cookie: "sb-project-auth-token=abc123" }));

    expect(result).toEqual({ id: "cookie-user" });
    // The no-argument form: the JWT lives in the cookie the client already read.
    expect(getClaims).toHaveBeenCalledWith();
  });

  it("resolves as a guest for a forged cookie session", async () => {
    const getClaims = vi.fn(async () => ({ data: null, error: { message: "invalid signature" } }));
    createServerClientMock.mockReturnValue(fakeAuthClient({ getClaims }));

    const { getVerifiedUser } = await loadModule();
    const result = await getVerifiedUser(requestWith({ cookie: "sb-project-auth-token=forged" }));

    expect(result).toBeNull();
  });

  it("resolves as a guest when there is no cookie and no bearer token", async () => {
    const getClaims = vi.fn(async () => ({ data: { claims: undefined }, error: null }));
    createServerClientMock.mockReturnValue(fakeAuthClient({ getClaims }));

    const { getVerifiedUser } = await loadModule();
    const result = await getVerifiedUser(requestWith({}));

    expect(result).toBeNull();
  });

  it("falls back to the remote getUser() when getClaims is unavailable", async () => {
    const getUser = vi.fn(async () => ({ data: { user: { id: "cookie-user-2" } }, error: null }));
    createServerClientMock.mockReturnValue(fakeAuthClient({ getClaims: undefined, getUser }));

    const { getVerifiedUser } = await loadModule();
    const result = await getVerifiedUser(requestWith({ cookie: "sb-project-auth-token=abc" }));

    expect(result).toEqual({ id: "cookie-user-2" });
  });
});
