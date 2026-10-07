import { describe, expect, it } from "vitest";
import {
  advanceStreak,
  currentStreak,
  FREEZE_COOLDOWN_DAYS,
  freezeLabel,
  freezeReadyIn,
  localDate,
  streakHeadline,
  streakMessage,
  streakStatus,
  streakWeek,
  type StreakState,
} from "./streak";

function state(overrides: Partial<StreakState> = {}): StreakState {
  return {
    play_streak: 0,
    best_play_streak: 0,
    last_played_on: null,
    last_freeze_on: null,
    ...overrides,
  };
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
      last_freeze_on: null,
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
      last_freeze_on: null,
    });
  });

  it("freezes one missed day and records it", () => {
    const current = state({ play_streak: 9, best_play_streak: 9, last_played_on: "2026-03-14" });
    expect(advanceStreak(current, "2026-03-16")).toEqual({
      play_streak: 10,
      best_play_streak: 10,
      last_played_on: "2026-03-16",
      last_freeze_on: "2026-03-15",
    });
  });

  it("resets on a missed day while the freeze is recharging", () => {
    const current = state({
      play_streak: 9,
      best_play_streak: 9,
      last_played_on: "2026-03-14",
      last_freeze_on: "2026-03-10",
    });
    expect(advanceStreak(current, "2026-03-16")).toEqual({
      play_streak: 1,
      best_play_streak: 9,
      last_played_on: "2026-03-16",
      last_freeze_on: "2026-03-10",
    });
  });

  it("freezes again once FREEZE_COOLDOWN_DAYS have passed", () => {
    const current = state({
      play_streak: 9,
      best_play_streak: 9,
      last_played_on: "2026-03-14",
      last_freeze_on: "2026-03-08",
    });
    expect(advanceStreak(current, "2026-03-16")?.last_freeze_on).toBe("2026-03-15");
  });

  it("resets to 1 after missing two days", () => {
    const current = state({ play_streak: 9, best_play_streak: 9, last_played_on: "2026-03-14" });
    expect(advanceStreak(current, "2026-03-17")).toEqual({
      play_streak: 1,
      best_play_streak: 9,
      last_played_on: "2026-03-17",
      last_freeze_on: null,
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
      last_freeze_on: null,
    });
  });
});

describe("streakStatus / streakHeadline / streakMessage", () => {
  const base = { play_streak: 9, last_played_on: "2026-03-14", last_freeze_on: null };

  it("is active the day after playing and frozen two days after", () => {
    expect(streakStatus(base, "2026-03-15")).toBe("active");
    expect(streakStatus(base, "2026-03-16")).toBe("frozen");
    expect(currentStreak(base, "2026-03-16")).toBe(9);
    expect(streakHeadline(base, "2026-03-16")).toBe("Streak Frozen!");
    expect(streakMessage(base, "2026-03-16")).toContain("thaw your 9-day streak");
  });

  it("is lost from the third day, and shows 0", () => {
    expect(streakStatus(base, "2026-03-17")).toBe("lost");
    expect(currentStreak(base, "2026-03-17")).toBe(0);
    expect(streakHeadline(base, "2026-03-17")).toBe("Streak Lost");
    expect(streakMessage(base, "2026-03-17")).toContain("missed more than one day");
    expect(streakMessage(base, "2026-03-17")).toContain("start a fresh one");
  });

  it("is lost after one missed day while the freeze is recharging, and says why", () => {
    const recharging = { ...base, last_freeze_on: "2026-03-10" };
    expect(streakStatus(recharging, "2026-03-16")).toBe("lost");
    expect(streakMessage(recharging, "2026-03-16")).toContain("still recharging");
  });

  it("stays lost however long the lapse", () => {
    expect(streakStatus(base, "2026-09-01")).toBe("lost");
  });

  it("is none for a player who never played", () => {
    expect(
      streakStatus({ play_streak: 0, last_played_on: null, last_freeze_on: null }, "2026-03-14"),
    ).toBe("none");
  });

  it("agrees with advanceStreak on whether the streak survives", () => {
    const full = { ...base, best_play_streak: 9 };
    for (const day of ["2026-03-15", "2026-03-16", "2026-03-17"]) {
      const survives = (advanceStreak(full, day)?.play_streak ?? 0) > 1;
      expect(survives).toBe(streakStatus(full, day) !== "lost");
    }
    const recharging = { ...full, last_freeze_on: "2026-03-10" };
    expect(advanceStreak(recharging, "2026-03-16")?.play_streak).toBe(1);
    expect(streakStatus(recharging, "2026-03-16")).toBe("lost");
  });
});

describe("freezeReadyIn / freezeLabel", () => {
  it("is ready when no freeze was ever used", () => {
    const s = { play_streak: 3, last_played_on: "2026-03-14", last_freeze_on: null };
    expect(freezeReadyIn(s, "2026-03-14")).toBe(0);
    expect(freezeLabel(s, "2026-03-14")).toBe("Streak Freeze charged and ready");
  });

  it("counts down from the last freeze", () => {
    const s = { play_streak: 3, last_played_on: "2026-03-14", last_freeze_on: "2026-03-12" };
    expect(freezeReadyIn(s, "2026-03-14")).toBe(FREEZE_COOLDOWN_DAYS - 2);
    expect(freezeLabel(s, "2026-03-14")).toBe("Streak Freeze recharging: back in 5 days");
  });

  it("counts a freeze holding the streak today from yesterday", () => {
    const s = { play_streak: 3, last_played_on: "2026-03-14", last_freeze_on: null };
    expect(freezeReadyIn(s, "2026-03-16")).toBe(FREEZE_COOLDOWN_DAYS - 1);
  });

  it("has nothing to say without a live streak", () => {
    const s = { play_streak: 3, last_played_on: "2026-03-01", last_freeze_on: null };
    expect(freezeLabel(s, "2026-03-14")).toBeNull();
  });
});

describe("streakWeek", () => {
  const marks = (days: ReturnType<typeof streakWeek>) =>
    days.map((d) => (d.frozen ? "F" : d.played ? "P" : ".")).join("");

  it("ticks a plain run", () => {
    const s = { play_streak: 3, last_played_on: "2026-03-14", last_freeze_on: null };
    expect(marks(streakWeek(s, "2026-03-14"))).toBe("....PPP");
  });

  it("shows a stored freeze inside the run without shifting the played days", () => {
    // Played 11, 12, froze 13, played 14: four calendar days, three played.
    const s = { play_streak: 3, last_played_on: "2026-03-14", last_freeze_on: "2026-03-13" };
    expect(marks(streakWeek(s, "2026-03-14"))).toBe("...PPFP");
  });

  it("shows yesterday frozen while the freeze is holding the streak", () => {
    const s = { play_streak: 2, last_played_on: "2026-03-14", last_freeze_on: null };
    expect(marks(streakWeek(s, "2026-03-16"))).toBe("...PPF.");
  });

  it("ignores a freeze from an earlier streak", () => {
    const s = { play_streak: 2, last_played_on: "2026-03-14", last_freeze_on: "2026-03-10" };
    expect(marks(streakWeek(s, "2026-03-14"))).toBe(".....PP");
  });

  it("paints nothing once the streak is lost", () => {
    const s = { play_streak: 5, last_played_on: "2026-03-10", last_freeze_on: null };
    expect(marks(streakWeek(s, "2026-03-14"))).toBe(".......");
  });
});
