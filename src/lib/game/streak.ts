/**
 * Daily play streak: consecutive calendar days on which a player took a turn.
 *
 * The boundary is the player's *local* midnight, not UTC. A player in Kolkata
 * playing at 02:00 IST is on a different date than UTC would report, and using
 * UTC would break their streak for playing late in the evening.
 *
 * Pure module — no I/O, no clock of its own. The caller supplies `now`, which
 * keeps the day-boundary cases directly testable.
 */

export interface StreakState {
  play_streak: number;
  best_play_streak: number;
  /** `YYYY-MM-DD` in the player's own timezone, or null if they never played. */
  last_played_on: string | null;
}

/**
 * Formats an instant as a `YYYY-MM-DD` calendar date in the given timezone.
 *
 * `en-CA` is used because it formats as ISO-ordered `YYYY-MM-DD`, which sorts
 * correctly as a string and matches the Postgres `DATE` representation.
 */
export function localDate(now: Date, timezone?: string | null): string {
  const zone = timezone?.trim();
  if (zone) {
    try {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: zone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(now);
    } catch {
      // An unrecognised or spoofed timezone string. Fall through to UTC rather
      // than failing the move that triggered this.
    }
  }
  return now.toISOString().slice(0, 10);
}

/**
 * `date` shifted by `delta` calendar days, handling month and year ends.
 *
 * Parsed as UTC deliberately: these are calendar dates with no time component,
 * so arithmetic must not be shifted by a local offset.
 */
function addCalendarDays(date: string, delta: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + delta)).toISOString().slice(0, 10);
}

/** The calendar day after `date`, handling month and year ends. */
function nextCalendarDay(date: string): string {
  return addCalendarDays(date, 1);
}

/** Sunday-first, so it can be indexed straight off `getUTCDay()`. */
const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

export interface StreakDay {
  /** `YYYY-MM-DD` in the player's own timezone. */
  date: string;
  /** Single-letter weekday label. Not unique across a week — display only. */
  label: string;
  /** True when this day is part of the current streak. */
  played: boolean;
  isToday: boolean;
}

/** How many day cells the weekly view shows, today last. */
export const STREAK_WEEK_LENGTH = 7;

/**
 * The trailing week ending on `today`, marking which days the current streak
 * covers.
 *
 * Derived rather than read from a log: no per-day play history is stored, but
 * a streak of N ending on `last_played_on` is by definition N consecutive days,
 * so the covered range is known exactly. The one thing this cannot show is a
 * day played *before* a break earlier in the same week — that day is no longer
 * part of the streak, which is what this view is about.
 */
export function streakWeek(
  state: Pick<StreakState, "play_streak" | "last_played_on">,
  today: string,
  length: number = STREAK_WEEK_LENGTH,
): StreakDay[] {
  const last = state.last_played_on;
  // A streak of 0 has no covered range at all, even if a stale date lingers.
  const first =
    last !== null && state.play_streak > 0 ? addCalendarDays(last, -(state.play_streak - 1)) : null;

  return Array.from({ length }, (_, i) => {
    const date = addCalendarDays(today, i - (length - 1));
    const [year, month, day] = date.split("-").map(Number);
    return {
      date,
      label: WEEKDAY_LETTERS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()],
      // ISO dates sort lexicographically, so string comparison is date order.
      played: first !== null && last !== null && date >= first && date <= last,
      isToday: date === today,
    };
  });
}

/**
 * Works out the streak after a player takes a turn on `today`.
 *
 * Returns null when nothing changes, so the caller can skip the write — the
 * common case by far, since most turns are not the first of a day.
 */
export function advanceStreak(state: StreakState, today: string): StreakState | null {
  // Already counted today.
  if (state.last_played_on === today) return null;

  const continuing =
    state.last_played_on !== null && nextCalendarDay(state.last_played_on) === today;

  /*
   * A gap resets to 1 rather than 0: the player is playing right now, so today
   * counts as the first day of a new streak.
   *
   * A `last_played_on` in the future is treated as a reset too. It should not
   * happen, but a player travelling west across timezones can report an earlier
   * local date than their last turn, and this keeps that from producing a
   * negative or frozen streak.
   */
  const play_streak = continuing ? state.play_streak + 1 : 1;

  return {
    play_streak,
    best_play_streak: Math.max(state.best_play_streak, play_streak),
    last_played_on: today,
  };
}
