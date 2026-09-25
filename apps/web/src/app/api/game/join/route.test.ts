import { beforeEach, describe, expect, it, vi } from "vitest";

const joinGameMock = vi.fn();

vi.mock("@/lib/game/service.server", () => ({
  joinGame: (...args: unknown[]) => joinGameMock(...args),
}));

vi.mock("@/lib/game/identity.server", async () => {
  const actual = await vi.importActual<typeof import("@/lib/game/identity.server")>(
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

function request(body: unknown, ip: string) {
  return new Request("http://localhost/api/game/join", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

describe("POST /api/game/join", () => {
  beforeEach(() => {
    joinGameMock.mockReset();
  });

  it("rejects a payload missing a room code", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      request({ sessionId: "11111111-1111-1111-1111-111111111111" }, "1.1.1.1"),
    );
    expect(res.status).toBe(400);
    expect(joinGameMock).not.toHaveBeenCalled();
  });

  it("delegates a valid payload to joinGame and returns its result", async () => {
    joinGameMock.mockResolvedValue({ roomCode: "ABCDE" });
    const { POST } = await import("./route");
    const res = await POST(
      request({ sessionId: "11111111-1111-1111-1111-111111111111", roomCode: "abcde" }, "2.2.2.2"),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ roomCode: "ABCDE" });
    expect(joinGameMock).toHaveBeenCalledWith(expect.anything(), "ABCDE");
  });

  it("rate-limits repeated join attempts from the same IP", async () => {
    joinGameMock.mockResolvedValue({ roomCode: "ABCDE" });
    const { POST } = await import("./route");
    const ip = "3.3.3.3";
    const body = { sessionId: "11111111-1111-1111-1111-111111111111", roomCode: "ABCDE" };

    let lastStatus = 200;
    for (let i = 0; i < 20; i++) {
      lastStatus = (await POST(request(body, ip))).status;
    }

    expect(lastStatus).toBe(429);
  });
});
