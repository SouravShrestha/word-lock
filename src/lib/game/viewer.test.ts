import { describe, expect, it } from "vitest";
import { findViewerId, type ViewerCandidate } from "./viewer";

const HOST: ViewerCandidate = {
  id: "player-host",
  session_id: "session-host",
  user_id: "user-host",
};

const GUEST: ViewerCandidate = {
  id: "player-guest",
  session_id: "session-guest",
  user_id: null,
};

const players = [HOST, GUEST];

describe("findViewerId", () => {
  it("matches a logged-in caller on their verified account", () => {
    expect(findViewerId(players, { userId: "user-host" })).toBe("player-host");
  });

  it("ignores the body session id for a logged-in caller", () => {
    // The whole point of the seam: a verified account cannot be overridden by
    // claiming to be somebody else in the request body.
    const viewer = findViewerId(players, {
      userId: "user-host",
      sessionId: "session-guest",
    });
    expect(viewer).toBe("player-host");
  });

  it("falls back to the session id for a guest", () => {
    expect(findViewerId(players, { userId: null, sessionId: "session-guest" })).toBe(
      "player-guest",
    );
  });

  it("returns null for a spectator", () => {
    expect(findViewerId(players, { userId: null, sessionId: "session-nobody" })).toBeNull();
    expect(findViewerId(players, { userId: "user-nobody" })).toBeNull();
  });

  it("returns null when a guest has no session id at all", () => {
    expect(findViewerId(players, { userId: null })).toBeNull();
    expect(findViewerId(players, { userId: null, sessionId: "" })).toBeNull();
  });

  it("does not match a null user_id against a guest caller's null account", () => {
    // Two nulls must not be treated as the same identity, or every guest would
    // resolve to the first unclaimed player in the game.
    expect(findViewerId([GUEST], { userId: null, sessionId: "session-other" })).toBeNull();
  });

  it("returns null for an empty game", () => {
    expect(findViewerId([], { userId: "user-host" })).toBeNull();
  });
});
