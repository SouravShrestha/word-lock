import { beforeEach, describe, expect, it, vi } from "vitest";

const checkUsernameAvailableMock = vi.fn();

vi.mock("@/lib/account/service.server", () => ({
  checkUsernameAvailable: (...args: unknown[]) => checkUsernameAvailableMock(...args),
}));

function request(username: string, ip: string) {
  const url = new URL("http://localhost/api/account/username/check");
  url.searchParams.set("u", username);
  return new Request(url, { headers: { "x-forwarded-for": ip } });
}

describe("GET /api/account/username/check", () => {
  beforeEach(() => {
    checkUsernameAvailableMock.mockReset();
  });

  it("reports a too-long candidate as unavailable without querying the database", async () => {
    const { GET } = await import("./route");
    const res = await GET(request("x".repeat(200), "20.0.0.1"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ available: false, reason: "Too long." });
    expect(checkUsernameAvailableMock).not.toHaveBeenCalled();
  });

  it("delegates a reasonable candidate to checkUsernameAvailable", async () => {
    checkUsernameAvailableMock.mockResolvedValue({ available: true });
    const { GET } = await import("./route");
    const res = await GET(request("alice", "20.0.0.2"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ available: true });
    expect(checkUsernameAvailableMock).toHaveBeenCalledWith("alice");
  });

  it("rate-limits repeated checks from the same IP", async () => {
    checkUsernameAvailableMock.mockResolvedValue({ available: true });
    const { GET } = await import("./route");
    const ip = "20.0.0.3";

    let lastStatus = 200;
    for (let i = 0; i < 40; i++) {
      lastStatus = (await GET(request("alice", ip))).status;
    }

    expect(lastStatus).toBe(429);
  });
});
