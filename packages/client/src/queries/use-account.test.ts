import { describe, expect, it } from "vitest";

import { loggedOutSummary } from "./use-account";

describe("loggedOutSummary", () => {
  it("resets streak, stars and avatar to a fresh account", () => {
    const out = loggedOutSummary({
      playerId: "p",
      username: "someone",
      usernameLocked: true,
      avatar: "avatar_07",
      joinedAt: "2026-01-01",
      stars: 1234,
      peakStars: 1500,
      starGames: 40,
      playStreak: 9,
      bestPlayStreak: 12,
      lastPlayedOn: "2026-11-17",
      lastFreezeOn: null,
    });
    expect(out.avatar).toBe("avatar_01");
    expect(out.stars).toBe(200);
    expect(out.playStreak).toBe(0);
    expect(out.lastPlayedOn).toBeNull();
    expect(out.username).toBe("someone");
  });
});
