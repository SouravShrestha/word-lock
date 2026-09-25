import { beforeEach, describe, expect, it, vi } from "vitest";

const submitMoveMock = vi.fn();

vi.mock("@/lib/game/service.server", () => ({
  submitMove: (...args: unknown[]) => submitMoveMock(...args),
}));

vi.mock("@/lib/game/identity.server", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/game/identity.server")>(
      "@/lib/game/identity.server",
    );
  return {
    ...actual,
    resolveCaller: vi.fn(async (_req: Request, input: { sessionId: string }) => ({
      sessionId: input.sessionId,
      userId: null,
    })),
  };
});

function request(body: unknown) {
  return new Request("http://localhost/api/game/move", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID_SESSION = "11111111-1111-1111-1111-111111111111";

describe("POST /api/game/move", () => {
  beforeEach(() => {
    submitMoveMock.mockReset();
  });

  it("rejects a word shorter than the minimum length", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      request({ sessionId: VALID_SESSION, roomCode: "ABCDE", word: "AB", tileIndices: [0, 1] }),
    );
    expect(res.status).toBe(400);
    expect(submitMoveMock).not.toHaveBeenCalled();
  });

  it("rejects a tile index outside the 5x5 grid", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      request({
        sessionId: VALID_SESSION,
        roomCode: "ABCDE",
        word: "CAT",
        tileIndices: [0, 1, 99],
      }),
    );
    expect(res.status).toBe(400);
    expect(submitMoveMock).not.toHaveBeenCalled();
  });

  it("delegates a valid move to submitMove, upper-casing the room code", async () => {
    submitMoveMock.mockResolvedValue({ ok: true });
    const { POST } = await import("./route");
    const res = await POST(
      request({ sessionId: VALID_SESSION, roomCode: "abcde", word: "CAT", tileIndices: [0, 1, 2] }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(submitMoveMock).toHaveBeenCalledWith(expect.anything(), "ABCDE", "CAT", [0, 1, 2]);
  });

  it("turns a business-rule rejection into the error response, not a 500", async () => {
    const { PublicError } = await import("@/lib/http/errors");
    submitMoveMock.mockRejectedValue(new PublicError("It's not your turn yet."));
    const { POST } = await import("./route");
    const res = await POST(
      request({ sessionId: VALID_SESSION, roomCode: "ABCDE", word: "CAT", tileIndices: [0, 1, 2] }),
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "It's not your turn yet." });
  });
});
