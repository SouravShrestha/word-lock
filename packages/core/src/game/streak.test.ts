import { describe, expect, it } from "vitest";
import { advanceStreak, localDate, type StreakState } from "./streak";

function state(overrides: Partial<StreakState> = {}): StreakState {
  return { play_streak: 0, best_play_streak: 0, last_played_on: null, ...overrides };
}

describe("localDate", () => {
  it("formats as YYYY-MM-DD", () => {
    expect(localDate(new Date("2026-03-14T12:00:00Z"), "UTC")).toBe("2026-03-14");
  });

  it("uses the player's local day, not the UTC day", () => {
    // 22:30 UTC is already the next day in Kolkata (+05:30).
    const instant = new Date("2026-03-14T22:30:00Z");
    expect(localDate(instant, "UTC")).toBe("2026-03-14");
    expect(localDate(instant, "Asia/Kolkata")).toBe("2026-03-15");
  });

  it("handles timezones behind UTC", () => {
    // 02:00 UTC is still the previous evening in Los Angeles.
    const instant = new Date("2026-03-15T02:00:00Z");
    expect(localDate(instant, "America/Los_Angeles")).toBe("2026-03-14");
  });

  it("falls back to UTC for a missing or unusable timezone", () => {
    const instant = new Date("2026-03-14T22:30:00Z");
    expect(localDate(instant, undefined)).toBe("2026-03-14");
    expect(localDate(instant, null)).toBe("2026-03-14");
    expect(localDate(instant, "")).toBe("2026-03-14");
    expect(localDate(instant, "   ")).toBe("2026-03-14");
    expect(localDate(instant, "Not/AZone")).toBe("2026-03-14");
  });
});

describe("advanceStreak", () => {
  it("starts a streak at 1 on a player's first ever turn", () => {
    expect(advanceStreak(state(), "2026-03-14")).toEqual({
      play_streak: 1,
      best_play_streak: 1,
      last_played_on: "2026-03-14",
    });
  });

  it("returns null when the player already played today", () => {
    const current = state({ play_streak: 3, best_play_streak: 5, last_played_on: "2026-03-14" });
    expect(advanceStreak(current, "2026-03-14")).toBeNull();
  });

  it("increments on a consecutive day", () => {
    const current = state({ play_streak: 3, best_play_streak: 5, last_played_on: "2026-03-14" });
    expect(advanceStreak(current, "2026-03-15")).toEqual({
      play_streak: 4,
      best_play_streak: 5,
      last_played_on: "2026-03-15",
    });
  });

  it("continues with a 1-day grace period after a missed day", () => {
    const current = state({ play_streak: 9, best_play_streak: 9, last_played_on: "2026-03-14" });
    expect(advanceStreak(current, "2026-03-16")).toEqual({
      play_streak: 10,
      best_play_streak: 10,
      last_played_on: "2026-03-16",
    });
  });

  it("resets to 1 after missing two days", () => {
    const current = state({ play_streak: 9, best_play_streak: 9, last_played_on: "2026-03-14" });
    expect(advanceStreak(current, "2026-03-17")).toEqual({
      play_streak: 1,
      best_play_streak: 9,
      last_played_on: "2026-03-17",
    });
  });

  it("raises the personal best when the current streak passes it", () => {
    const current = state({ play_streak: 5, best_play_streak: 5, last_played_on: "2026-03-14" });
    expect(advanceStreak(current, "2026-03-15")?.best_play_streak).toBe(6);
  });

  it("crosses a month end", () => {
    const current = state({ play_streak: 2, best_play_streak: 2, last_played_on: "2026-03-31" });
    expect(advanceStreak(current, "2026-04-01")?.play_streak).toBe(3);
  });

  it("crosses a year end", () => {
    const current = state({ play_streak: 7, best_play_streak: 7, last_played_on: "2026-12-31" });
    expect(advanceStreak(current, "2027-01-01")?.play_streak).toBe(8);
  });

  it("crosses a leap day", () => {
    const current = state({ play_streak: 1, best_play_streak: 1, last_played_on: "2028-02-28" });
    expect(advanceStreak(current, "2028-02-29")?.play_streak).toBe(2);
  });

  it("treats a last-played date in the future as a reset", () => {
    // Possible when a player travels west and reports an earlier local date.
    const current = state({ play_streak: 4, best_play_streak: 6, last_played_on: "2026-03-20" });
    expect(advanceStreak(current, "2026-03-14")).toEqual({
      play_streak: 1,
      best_play_streak: 6,
      last_played_on: "2026-03-14",
    });
  });
});
