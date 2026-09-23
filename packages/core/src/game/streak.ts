export interface StreakState {
  play_streak: number;
  best_play_streak: number;
  last_played_on: string | null;
}

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

function addCalendarDays(date: string, delta: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + delta)).toISOString().slice(0, 10);
}

function nextCalendarDay(date: string): string {
  return addCalendarDays(date, 1);
}

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

export interface StreakDay {
  date: string;
  label: string;
  played: boolean;
  isToday: boolean;
}

export const STREAK_WEEK_LENGTH = 7;

export function streakWeek(
  state: Pick<StreakState, "play_streak" | "last_played_on">,
  today: string,
  length: number = STREAK_WEEK_LENGTH,
): StreakDay[] {
  const last = state.last_played_on;
  const first =
    last !== null && state.play_streak > 0 ? addCalendarDays(last, -(state.play_streak - 1)) : null;

  return Array.from({ length }, (_, i) => {
    const date = addCalendarDays(today, i - (length - 1));
    const [year, month, day] = date.split("-").map(Number);
    return {
      date,
      label: WEEKDAY_LETTERS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()],
      played: first !== null && last !== null && date >= first && date <= last,
      isToday: date === today,
    };
  });
}

export function advanceStreak(state: StreakState, today: string): StreakState | null {
  if (state.last_played_on === today) return null;

  const continuing =
    state.last_played_on !== null && nextCalendarDay(state.last_played_on) === today;

  const play_streak = continuing ? state.play_streak + 1 : 1;

  return {
    play_streak,
    best_play_streak: Math.max(state.best_play_streak, play_streak),
    last_played_on: today,
  };
}
