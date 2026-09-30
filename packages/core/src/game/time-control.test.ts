import { describe, expect, it } from "vitest";
import {
  CLOCK_GRACE_MS,
  DAILY_TURN_MS,
  chargeClock,
  clockLabelFor,
  formatClock,
  initialClocks,
  isTimeControl,
  isTurnExpired,
  timeControlFor,
  turnDeadlineFor,
} from "./time-control";

const T0 = Date.UTC(2026, 0, 1, 12, 0, 0);
const iso = (ms: number) => new Date(ms).toISOString();

describe("time controls", () => {
  it("knows the four ids and falls back to daily", () => {
    expect(isTimeControl("10m")).toBe(true);
    expect(isTimeControl("daily")).toBe(true);
    expect(isTimeControl("5m")).toBe(false);
    expect(timeControlFor(undefined).id).toBe("daily");
    expect(timeControlFor("nonsense").id).toBe("daily");
  });

  it("gives both players the same bank, none for daily", () => {
    expect(initialClocks("30m")).toEqual({ 1: 30 * 60_000, 2: 30 * 60_000 });
    expect(initialClocks("daily")).toEqual({ 1: null, 2: null });
  });

  it("charges only the elapsed turn and floors at zero", () => {
    expect(chargeClock(600_000, iso(T0), T0 + 45_000)).toBe(555_000);
    expect(chargeClock(10_000, iso(T0), T0 + 60_000)).toBe(0);
    expect(chargeClock(null, iso(T0), T0 + 60_000)).toBeNull();
    // A clock skewed behind the turn start never adds time.
    expect(chargeClock(600_000, iso(T0), T0 - 5_000)).toBe(600_000);
  });

  it("sets the deadline from the bank, or 24h for daily", () => {
    expect(turnDeadlineFor("10m", 123_000, T0)).toBe(iso(T0 + 123_000));
    expect(turnDeadlineFor("daily", null, T0)).toBe(iso(T0 + DAILY_TURN_MS));
  });

  it("allows the grace period before a turn counts as expired", () => {
    expect(isTurnExpired(iso(T0), T0 + CLOCK_GRACE_MS)).toBe(false);
    expect(isTurnExpired(iso(T0), T0 + CLOCK_GRACE_MS + 1)).toBe(true);
    expect(isTurnExpired(null, T0)).toBe(false);
  });

  it("formats clocks as m:ss, h:mm:ss from an hour", () => {
    expect(formatClock(600_000)).toBe("10:00");
    expect(formatClock(59_001)).toBe("1:00");
    expect(formatClock(3_600_000)).toBe("1:00:00");
    expect(formatClock(-5)).toBe("0:00");
  });
});

describe("clockLabelFor", () => {
  const bank = {
    status: "active",
    timeControl: "10m",
    turnDeadline: iso(T0 + 90_000),
    clocks: { 1: 600_000, 2: 420_000 },
  };

  it("counts the player on turn down to the deadline", () => {
    expect(clockLabelFor(bank, 1, true, T0)).toBe("1:30");
  });

  it("shows the idle player's stored bank", () => {
    expect(clockLabelFor(bank, 2, false, T0)).toBe("7:00");
  });

  it("shows banks before and after the game", () => {
    expect(clockLabelFor({ ...bank, status: "waiting" }, 1, false, T0)).toBe("10:00");
    expect(clockLabelFor({ ...bank, status: "completed" }, 2, false, T0)).toBe("7:00");
  });

  it("gives daily games a clock only on the player on turn", () => {
    const daily = {
      status: "active",
      timeControl: "daily",
      turnDeadline: iso(T0 + 5 * 3_600_000 + 7 * 60_000),
      clocks: { 1: null, 2: null },
    };
    expect(clockLabelFor(daily, 1, true, T0)).toBe("5h 07m");
    expect(clockLabelFor(daily, 2, false, T0)).toBe("-");
    expect(clockLabelFor({ ...daily, turnDeadline: iso(T0 + 65_000) }, 1, true, T0)).toBe("1m 05s");
  });
});
