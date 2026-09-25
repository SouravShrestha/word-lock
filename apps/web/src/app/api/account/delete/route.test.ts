import { beforeEach, describe, expect, it, vi } from "vitest";

const deleteAccountMock = vi.fn();

vi.mock("@/lib/game/service.server", () => ({
  deleteAccount: (...args: unknown[]) => deleteAccountMock(...args),
}));

vi.mock("@/lib/game/identity.server", async () => {
  const actual = await vi.importActual<typeof import("@/lib/game/identity.server")>(
    "@/lib/game/identity.server",
  );
  return {
    ...actual,
    resolveCaller: vi.fn(async (_req: Request, input: { sessionId: string }) => ({
      sessionId: input.sessionId,
      userId: "u1",
    })),
  };
});

function request(body: unknown) {
  return new Request("http://localhost/api/account/delete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/account/delete", () => {
  beforeEach(() => {
    deleteAccountMock.mockReset();
  });

  it("rejects an invalid payload", async () => {
    const { POST } = await import("./route");
    const res = await POST(request({}));
    expect(res.status).toBe(400);
    expect(deleteAccountMock).not.toHaveBeenCalled();
  });

  it("delegates entirely to deleteAccount — the route itself never touches the admin client", async () => {
    deleteAccountMock.mockResolvedValue({ ok: true });
    const { POST } = await import("./route");
    const res = await POST(request({ sessionId: "11111111-1111-1111-1111-111111111111" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(deleteAccountMock).toHaveBeenCalledTimes(1);
  });

  it("does not import the service-role Supabase client directly", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("./route.ts", import.meta.url), "utf8"),
    );
    expect(source).not.toContain("client.server");
  });
});
