import { describe, expect, it } from "vitest";
import {
  CLOCK_GRACE_MS,
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
  it("knows the three ids and reads retired ones as the default", () => {
    expect(isTimeControl("5m")).toBe(true);
    expect(isTimeControl("15m")).toBe(true);
    expect(isTimeControl("daily")).toBe(false);
    expect(isTimeControl("30m")).toBe(false);
    expect(timeControlFor(undefined).id).toBe("10m");
    expect(timeControlFor("daily").id).toBe("10m");
  });

  it("gives both players the same bank", () => {
    expect(initialClocks("5m")).toEqual({ 1: 5 * 60_000, 2: 5 * 60_000 });
    expect(initialClocks("15m")).toEqual({ 1: 15 * 60_000, 2: 15 * 60_000 });
  });

  it("charges only the elapsed turn and floors at zero", () => {
    expect(chargeClock(600_000, iso(T0), T0 + 45_000)).toBe(555_000);
    expect(chargeClock(10_000, iso(T0), T0 + 60_000)).toBe(0);
    expect(chargeClock(null, iso(T0), T0 + 60_000)).toBeNull();
    // A clock skewed behind the turn start never adds time.
    expect(chargeClock(600_000, iso(T0), T0 - 5_000)).toBe(600_000);
  });

  it("sets the deadline from the bank", () => {
    expect(turnDeadlineFor(123_000, T0)).toBe(iso(T0 + 123_000));
  });

  it("allows the grace period before a turn counts as expired", () => {
    expect(isTurnExpired(iso(T0), T0 + CLOCK_GRACE_MS)).toBe(false);
    expect(isTurnExpired(iso(T0), T0 + CLOCK_GRACE_MS + 1)).toBe(true);
    expect(isTurnExpired(null, T0)).toBe(false);
  });

  it("formats bank clocks consistently as mm:ss", () => {
    expect(formatClock(600_000)).toBe("10:00");
    expect(formatClock(59_001)).toBe("01:00");
    expect(formatClock(15 * 60_000)).toBe("15:00");
    expect(formatClock(-5)).toBe("00:00");
  });
});

describe("clockLabelFor", () => {
  const bank = {
    status: "active",
    turnDeadline: iso(T0 + 90_000),
    clocks: { 1: 600_000, 2: 420_000 },
  };

  it("counts the player on turn down to the deadline", () => {
    expect(clockLabelFor(bank, 1, true, T0)).toBe("01:30");
  });

  it("shows the idle player's stored bank", () => {
    expect(clockLabelFor(bank, 2, false, T0)).toBe("07:00");
  });

  it("shows banks before and after the game", () => {
    expect(clockLabelFor({ ...bank, status: "waiting" }, 1, false, T0)).toBe("10:00");
    expect(clockLabelFor({ ...bank, status: "completed" }, 2, false, T0)).toBe("07:00");
  });
});
