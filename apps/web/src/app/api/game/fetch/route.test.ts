import { beforeEach, describe, expect, it, vi } from "vitest";

const loadGameMock = vi.fn();
const serializeGameMock = vi.fn();
const findViewerIdMock = vi.fn();

vi.mock("@/lib/game/service.server", () => ({
  loadGame: (...args: unknown[]) => loadGameMock(...args),
  serializeGame: (...args: unknown[]) => serializeGameMock(...args),
  findViewerId: (...args: unknown[]) => findViewerIdMock(...args),
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
  return new Request("http://localhost/api/game/fetch", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

describe("POST /api/game/fetch", () => {
  beforeEach(() => {
    loadGameMock.mockReset();
    serializeGameMock.mockReset();
    findViewerIdMock.mockReset();
  });

  it("rejects a payload missing a room code", async () => {
    const { POST } = await import("./route");
    const res = await POST(request({}, "10.0.0.1"));
    expect(res.status).toBe(400);
    expect(loadGameMock).not.toHaveBeenCalled();
  });

  it("serves a spectator with no sessionId at all", async () => {
    loadGameMock.mockResolvedValue({ game: { id: "g1" }, moves: [], players: [] });
    findViewerIdMock.mockReturnValue(null);
    serializeGameMock.mockReturnValue({ id: "g1", viewerSlot: null });

    const { POST } = await import("./route");
    const res = await POST(request({ roomCode: "abcde" }, "10.0.0.2"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "g1", viewerSlot: null });
    expect(loadGameMock).toHaveBeenCalledWith("ABCDE");
  });

  it("returns null for a room code with no game, without resolving a caller", async () => {
    loadGameMock.mockResolvedValue(null);
    const { POST } = await import("./route");
    const res = await POST(
      request({ sessionId: "11111111-1111-1111-1111-111111111111", roomCode: "ZZZZZ" }, "10.0.0.3"),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toBeNull();
  });

  it("rate-limits repeated fetches from the same IP", async () => {
    loadGameMock.mockResolvedValue({ game: { id: "g1" }, moves: [], players: [] });
    findViewerIdMock.mockReturnValue(null);
    serializeGameMock.mockReturnValue({ id: "g1" });

    const { POST } = await import("./route");
    const ip = "10.0.0.4";
    const body = { roomCode: "ABCDE" };

    let lastStatus = 200;
    for (let i = 0; i < 130; i++) {
      lastStatus = (await POST(request(body, ip))).status;
    }

    expect(lastStatus).toBe(429);
  });
});
