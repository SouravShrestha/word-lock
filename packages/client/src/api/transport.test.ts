import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { configureApiClient, getApiConfig, resetApiConfig } from "./config";
import { ApiError } from "./errors";
import { get, post } from "./transport";

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

function brokenBody(status: number): Response {
  return {
    ok: false,
    status,
    json: async () => {
      throw new SyntaxError("Unexpected token < in JSON at position 0");
    },
  } as unknown as Response;
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  resetApiConfig();
  vi.unstubAllGlobals();
});

describe("default configuration", () => {
  it("is same-origin with no extra headers, i.e. exactly what the web app needs", async () => {
    expect(getApiConfig().baseUrl).toBe("");
    expect(await getApiConfig().getAuthHeaders()).toEqual({});

    await post("/api/game/move", { word: "CAT" });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/game/move");
  });
});

describe("configureApiClient", () => {
  it("prefixes the base URL", async () => {
    configureApiClient({ baseUrl: "https://wordlock.example" });
    await post("/api/game/move", {});
    expect(fetchMock.mock.calls[0][0]).toBe("https://wordlock.example/api/game/move");
  });

  it("strips a trailing slash so paths never double up", async () => {
    configureApiClient({ baseUrl: "https://wordlock.example/" });
    expect(getApiConfig().baseUrl).toBe("https://wordlock.example");
    await get("/api/account/leaderboard");
    expect(fetchMock.mock.calls[0][0]).toBe("https://wordlock.example/api/account/leaderboard");
  });

  it("merges partially, so one concern can be set without restating the other", async () => {
    configureApiClient({ baseUrl: "https://a.example" });
    configureApiClient({ getAuthHeaders: async () => ({ Authorization: "Bearer t" }) });

    expect(getApiConfig().baseUrl).toBe("https://a.example");
    await post("/api/game/pass", {});
    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe("Bearer t");
  });
});

describe("credentials", () => {
  it("attaches the auth headers to a POST alongside the content type", async () => {
    configureApiClient({ getAuthHeaders: async () => ({ Authorization: "Bearer abc" }) });
    await post("/api/game/move", { word: "CAT" });

    expect(fetchMock.mock.calls[0][1].headers).toEqual({
      Authorization: "Bearer abc",
      "Content-Type": "application/json",
    });
  });

  it("attaches them to a GET too", async () => {
    configureApiClient({ getAuthHeaders: async () => ({ Authorization: "Bearer abc" }) });
    await get("/api/account/leaderboard");
    expect(fetchMock.mock.calls[0][1].headers).toEqual({ Authorization: "Bearer abc" });
  });

  it("resolves the headers on every call, not once", async () => {
    let token = "first";
    configureApiClient({ getAuthHeaders: async () => ({ Authorization: `Bearer ${token}` }) });

    await post("/api/game/move", {});
    token = "second";
    await post("/api/game/move", {});

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer first");
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe("Bearer second");
  });

  it("sends no auth header when signed out, so the server resolves a guest", async () => {
    configureApiClient({ getAuthHeaders: async () => ({}) });
    await post("/api/game/fetch", {});
    expect(fetchMock.mock.calls[0][1].headers).toEqual({ "Content-Type": "application/json" });
  });
});

describe("error handling", () => {
  it("throws an ApiError carrying the status", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "Not your turn" }, 409));

    await expect(post("/api/game/move", {})).rejects.toMatchObject({
      name: "ApiError",
      message: "Not your turn",
      status: 409,
    });
  });

  it("surfaces the status even when the body is not JSON", async () => {
    fetchMock.mockResolvedValue(brokenBody(502));

    const error = await post("/api/game/move", {}).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(502);
    expect(error.message).toBe("HTTP error 502");
  });

  it("falls back to the status when the body has no error field", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 500));
    await expect(get("/api/account/leaderboard")).rejects.toMatchObject({
      message: "HTTP error 500",
      status: 500,
    });
  });
});

describe("request shape", () => {
  it("serialises the body as JSON", async () => {
    await post("/api/game/move", { word: "CAT", tileIndices: [0, 1, 2] });
    expect(fetchMock.mock.calls[0][1].method).toBe("POST");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      word: "CAT",
      tileIndices: [0, 1, 2],
    });
  });

  it("sends no body on a GET", async () => {
    await get("/api/account/leaderboard");
    expect(fetchMock.mock.calls[0][1].method).toBe("GET");
    expect(fetchMock.mock.calls[0][1].body).toBeUndefined();
  });
});
