import { beforeEach, describe, expect, it, vi } from "vitest";

const createGameMock = vi.fn();

vi.mock("@/lib/game/service.server", () => ({
  createGame: (...args: unknown[]) => createGameMock(...args),
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
  return new Request("http://localhost/api/game/create", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/game/create", () => {
  beforeEach(() => {
    createGameMock.mockReset();
  });

  it("rejects a payload with no sessionId", async () => {
    const { POST } = await import("./route");
    const res = await POST(request({}));
    expect(res.status).toBe(400);
    expect(createGameMock).not.toHaveBeenCalled();
  });

  it("delegates to createGame and returns the new room code", async () => {
    createGameMock.mockResolvedValue({ roomCode: "NEWRM" });
    const { POST } = await import("./route");
    const res = await POST(
      request({ sessionId: "11111111-1111-1111-1111-111111111111" }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ roomCode: "NEWRM" });
    expect(createGameMock).toHaveBeenCalledTimes(1);
  });

  it("turns the active-games-limit rejection into a 400, not a 500", async () => {
    const { PublicError } = await import("@/lib/http/errors");
    createGameMock.mockRejectedValue(
      new PublicError("You already have 5 games on the go. Finish one before starting another."),
    );
    const { POST } = await import("./route");
    const res = await POST(
      request({ sessionId: "11111111-1111-1111-1111-111111111111" }),
    );

    expect(res.status).toBe(400);
  });
});
