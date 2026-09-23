import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetApiConfig } from "./config";
import * as game from "./game";

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  resetApiConfig();
  vi.unstubAllGlobals();
});

function lastCall() {
  const [url, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
  return { url, body: JSON.parse(init.body) };
}

describe("every game endpoint attaches a timezone", () => {
  const calls: Array<[string, () => Promise<unknown>]> = [
    ["lobby", () => game.fetchLobby({ sessionId: "s" })],
    ["create", () => game.createGameFn({ sessionId: "s" })],
    ["join", () => game.joinGameFn({ sessionId: "s", roomCode: "ABCDE" })],
    ["fetch", () => game.fetchGameFn({ sessionId: "s", roomCode: "ABCDE" })],
    [
      "move",
      () => game.submitMoveFn({ sessionId: "s", roomCode: "ABCDE", word: "CAT", tileIndices: [0] }),
    ],
    ["pass", () => game.passTurnFn({ sessionId: "s", roomCode: "ABCDE" })],
    ["start", () => game.startGameFn({ sessionId: "s", roomCode: "ABCDE" })],
    ["destroy", () => game.destroyGameFn({ sessionId: "s", roomCode: "ABCDE" })],
    ["forfeit", () => game.forfeitGameFn({ sessionId: "s", roomCode: "ABCDE" })],
    ["timeout", () => game.timeoutGameFn({ sessionId: "s", roomCode: "ABCDE" })],
    ["leave", () => game.leaveLobbyFn({ sessionId: "s", roomCode: "ABCDE" })],
    ["reaction", () => game.sendReactionFn({ sessionId: "s", roomCode: "ABCDE", emoji: "🔥" })],
    ["profile", () => game.fetchProfileFn({ sessionId: "s" })],
  ];

  it.each(calls)("%s", async (endpoint, call) => {
    await call();
    const { url, body } = lastCall();
    expect(url).toBe(`/api/game/${endpoint}`);
    expect(typeof body.timezone === "string" || body.timezone === undefined).toBe(true);
  });

  it("and the list above covers every exported game function", () => {
    const exported = Object.keys(game).filter((key) => typeof (game as any)[key] === "function");
    expect(exported).toHaveLength(calls.length);
  });
});

describe("fetcher spread order", () => {
  it("lets an explicit timezone in the payload override the injected one", async () => {
    await game.fetchGameFn({
      sessionId: "s",
      roomCode: "ABCDE",
      timezone: "Asia/Kolkata",
    } as Parameters<typeof game.fetchGameFn>[0] & { timezone: string });

    expect(lastCall().body.timezone).toBe("Asia/Kolkata");
  });

  it("passes the payload through otherwise untouched", async () => {
    await game.submitMoveFn({
      sessionId: "s-1",
      roomCode: "ABCDE",
      word: "CAT",
      tileIndices: [0, 1, 2],
    });

    const { body } = lastCall();
    expect(body.sessionId).toBe("s-1");
    expect(body.roomCode).toBe("ABCDE");
    expect(body.word).toBe("CAT");
    expect(body.tileIndices).toEqual([0, 1, 2]);
  });
});
