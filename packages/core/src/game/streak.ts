export interface StreakState {
  play_streak: number;
  best_play_streak: number;
  last_played_on: string | null;
  /** The most recent missed day a Streak Freeze covered, or null if none ever has. */
  last_freeze_on: string | null;
}

/**
 * A Streak Freeze covers one missed day, then needs this many days to recharge
 * before it can cover another. Because two frozen days are always at least this
 * far apart, a seven-day row can hold at most one — which is why storing only
 * the latest is enough to draw the week.
 */
export const FREEZE_COOLDOWN_DAYS = 7;

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
      // Fall back to UTC on invalid timezone
    }
  }
  return now.toISOString().slice(0, 10);
}

function toUtc(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function addCalendarDays(date: string, delta: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + delta)).toISOString().slice(0, 10);
}

/** Whole calendar days from `from` to `to`; negative when `to` is earlier. */
function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / 86_400_000);
}

type StreakView = Pick<StreakState, "play_streak" | "last_played_on" | "last_freeze_on">;

function freezeAvailableOn(lastFreezeOn: string | null, missedDay: string): boolean {
  return lastFreezeOn === null || daysBetween(lastFreezeOn, missedDay) >= FREEZE_COOLDOWN_DAYS;
}

/**
 * The missed day a freeze would cover if the player plays on `today`: exactly one
 * day skipped since they last played, with a freeze charged for it. Null otherwise.
 */
function freezableDay(state: StreakView, today: string): string | null {
  const last = state.last_played_on;
  if (last === null || daysBetween(last, today) !== 2) return null;
  const missed = addCalendarDays(last, 1);
  return freezeAvailableOn(state.last_freeze_on, missed) ? missed : null;
}

export type StreakStatus = "none" | "lost" | "played-today" | "active" | "frozen";

/**
 * Where the streak stands on `today`. The stored row is only rewritten when a
 * player takes a turn, so after a lapse it keeps the old count until their next
 * move; this is what tells a live streak from a stale one.
 *
 * `frozen` means yesterday was missed and a freeze is holding the streak: playing
 * today thaws it, missing today too loses it.
 */
export function streakStatus(state: StreakView, today: string): StreakStatus {
  const last = state.last_played_on;
  if (state.play_streak <= 0 || last === null) return "none";
  if (last === today) return "played-today";
  const gap = daysBetween(last, today);
  // A future last-played date (a player who travelled west) reads as live; the
  // next move resets it, matching advanceStreak.
  if (gap < 2) return "active";
  if (freezableDay(state, today) !== null) return "frozen";
  return "lost";
}

/** The streak to show: the stored count, or 0 once it has lapsed. */
export function currentStreak(state: StreakView, today: string): number {
  return streakStatus(state, today) === "lost" ? 0 : Math.max(state.play_streak, 0);
}

/**
 * Days until a freeze is charged again; 0 when it is ready now. A freeze that is
 * holding the streak today is not stored until the next move, so it is counted
 * from yesterday here.
 */
export function freezeReadyIn(state: StreakView, today: string): number {
  const lastFreeze =
    streakStatus(state, today) === "frozen" ? addCalendarDays(today, -1) : state.last_freeze_on;
  if (lastFreeze === null) return 0;
  return Math.max(0, FREEZE_COOLDOWN_DAYS - daysBetween(lastFreeze, today));
}

/** One-line freeze readout under the week, or null when there is no live streak to protect. */
export function freezeLabel(state: StreakView, today: string): string | null {
  const status = streakStatus(state, today);
  if (status === "none" || status === "lost") return null;
  const days = freezeReadyIn(state, today);
  if (days === 0) return "Streak Freeze charged and ready";
  return `Streak Freeze recharging: back in ${days} ${days === 1 ? "day" : "days"}`;
}

/** Headline for the streak sheet. */
export function streakHeadline(state: StreakView, today: string): string {
  switch (streakStatus(state, today)) {
    case "none":
      return "Start Your Streak!";
    case "lost":
      return "Streak Lost";
    case "frozen":
      return "Streak Frozen!";
    default: {
      const shown = currentStreak(state, today);
      return shown === 1 ? "1 Day Streak!" : `${shown} Day Streak!`;
    }
  }
}

/** Footer copy for the streak sheet, identical on both platforms. */
export function streakMessage(state: StreakView, today: string): string {
  const days = `${state.play_streak}-day streak`;
  const next = state.play_streak + 1;
  const fresh = "No worries, play a game today and start a fresh one!";
  switch (streakStatus(state, today)) {
    case "none":
      return "Every streak starts with one game. Play today and light the fire!";
    case "lost":
      return state.last_played_on !== null && daysBetween(state.last_played_on, today) === 2
        ? `Your ${days} has ended. You missed yesterday while your Streak Freeze was still recharging. ${fresh}`
        : `Your ${days} has ended. You missed more than one day, and a Streak Freeze only covers one. ${fresh}`;
    case "played-today":
      return `Nice! Today is in the bag. See you tomorrow to make it ${next}!`;
    case "frozen":
      return `Brrr! A Streak Freeze saved you yesterday. Play a game today to thaw your ${days} and keep it rolling!`;
    case "active":
      return `Your ${days} is waiting! Play a game today to make it ${next}.`;
  }
}

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

export interface StreakDay {
  date: string;
  label: string;
  played: boolean;
  /** A missed day a Streak Freeze covered (or is covering, if it was yesterday). */
  frozen: boolean;
  isToday: boolean;
}

export const STREAK_WEEK_LENGTH = 7;

/**
 * The trailing `length` days, marked played or frozen where they belong to the
 * live streak. A lapsed streak paints nothing.
 *
 * `play_streak` counts days played, not calendar days, so a run with a frozen day
 * inside it spans one day more. Only the latest freeze is stored; an older one
 * would sit at least FREEZE_COOLDOWN_DAYS further back, which puts the start of
 * any run long enough to contain it outside the row.
 */
export function streakWeek(
  state: StreakView,
  today: string,
  length: number = STREAK_WEEK_LENGTH,
): StreakDay[] {
  const status = streakStatus(state, today);
  const last = status === "none" || status === "lost" ? null : state.last_played_on;

  let first: string | null = null;
  let frozenInRun: string | null = null;
  if (last !== null) {
    const extended = addCalendarDays(last, -state.play_streak);
    const freeze = state.last_freeze_on;
    if (freeze !== null && freeze > extended && freeze < last) {
      first = extended;
      frozenInRun = freeze;
    } else {
      first = addCalendarDays(last, -(state.play_streak - 1));
    }
  }
  const holding = status === "frozen" ? addCalendarDays(today, -1) : null;

  return Array.from({ length }, (_, i) => {
    const date = addCalendarDays(today, i - (length - 1));
    const frozen = date === frozenInRun || date === holding;
    return {
      date,
      label: WEEKDAY_LETTERS[new Date(toUtc(date)).getUTCDay()],
      played: !frozen && first !== null && last !== null && date >= first && date <= last,
      frozen,
      isToday: date === today,
    };
  });
}

export function advanceStreak(state: StreakState, today: string): StreakState | null {
  if (state.last_played_on === today) return null;

  const frozen = freezableDay(state, today);
  const continuing =
    frozen !== null ||
    (state.last_played_on !== null && daysBetween(state.last_played_on, today) === 1);

  const play_streak = continuing ? state.play_streak + 1 : 1;

  return {
    play_streak,
    best_play_streak: Math.max(state.best_play_streak, play_streak),
    last_played_on: today,
    last_freeze_on: frozen ?? state.last_freeze_on,
  };
}
