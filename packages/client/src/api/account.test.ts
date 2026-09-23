import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetApiConfig } from "./config";
import { deleteAccountFn } from "./account";

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi
    .fn()
    .mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  resetApiConfig();
  vi.unstubAllGlobals();
});

describe("deleteAccountFn", () => {
  it("posts the session id to /api/account/delete", async () => {
    await deleteAccountFn({ sessionId: "s-1" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/account/delete");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ sessionId: "s-1" });
  });

  it("resolves with the server's response", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) });
    await expect(deleteAccountFn({ sessionId: "s-1" })).resolves.toEqual({ ok: true });
  });

  it("surfaces a rejection as an ApiError, e.g. a guest with no account to delete", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: "Log in to delete your account." }),
    });

    await expect(deleteAccountFn({ sessionId: "s-1" })).rejects.toMatchObject({
      message: "Log in to delete your account.",
      status: 400,
    });
  });
});
