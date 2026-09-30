/**
 * How long a player gets to move, chosen by the host when creating a room.
 *
 * Two different shapes live under one type:
 * - `bank` controls give each player a fixed amount of time for the whole game,
 *   spent only while it is their turn. Running out is a loss.
 * - `daily` is the original pace: every move gets 24 hours, and an expired move
 *   is passed for the player rather than losing them the game.
 *
 * The server stores the bank each player had at the start of the current turn
 * (`pN_clock_ms`) and the turn's deadline; everything else is derived here.
 */
export type TimeControl = "10m" | "30m" | "60m" | "daily";

export interface TimeControlOption {
  id: TimeControl;
  label: string;
  group: "bank" | "daily";
  bankMs: number | null;
}

const MINUTE = 60_000;

export const DAILY_TURN_MS = 24 * 60 * MINUTE;

export const TIME_CONTROLS: readonly TimeControlOption[] = [
  { id: "10m", label: "10 mins", group: "bank", bankMs: 10 * MINUTE },
  { id: "30m", label: "30 mins", group: "bank", bankMs: 30 * MINUTE },
  { id: "60m", label: "1 hour", group: "bank", bankMs: 60 * MINUTE },
  { id: "daily", label: "24 hours per move", group: "daily", bankMs: null },
] as const;

export const TIME_CONTROL_IDS = TIME_CONTROLS.map((c) => c.id) as [TimeControl, ...TimeControl[]];

/** What a row without the column (or with an unknown value) plays as. */
export const DEFAULT_TIME_CONTROL: TimeControl = "daily";

/**
 * Allowance for the time a move spends in flight. Without it, a move sent with
 * a fraction of a second on the clock would arrive late and lose the game.
 */
export const CLOCK_GRACE_MS = 1500;

export function isTimeControl(value: unknown): value is TimeControl {
  return TIME_CONTROLS.some((c) => c.id === value);
}

export function timeControlFor(value: string | null | undefined): TimeControlOption {
  return (
    TIME_CONTROLS.find((c) => c.id === value) ??
    TIME_CONTROLS.find((c) => c.id === DEFAULT_TIME_CONTROL)!
  );
}

export function isBankControl(value: string | null | undefined): boolean {
  return timeControlFor(value).group === "bank";
}

export interface Clocks {
  1: number | null;
  2: number | null;
}

export function initialClocks(control: TimeControl): Clocks {
  const { bankMs } = timeControlFor(control);
  return { 1: bankMs, 2: bankMs };
}

/**
 * The mover's bank after a turn that started at `turnStartedAt` and ended at
 * `now`. Null for daily games, which have no bank to spend.
 */
export function chargeClock(
  bankMs: number | null,
  turnStartedAt: string,
  now: number,
): number | null {
  if (bankMs === null) return null;
  const elapsed = Math.max(0, now - new Date(turnStartedAt).getTime());
  return Math.max(0, bankMs - elapsed);
}

/** When a turn starting at `now` expires, given the bank of the player on it. */
export function turnDeadlineFor(
  control: string | null | undefined,
  bankMs: number | null,
  now: number,
): string {
  const limit = isBankControl(control) ? (bankMs ?? 0) : DAILY_TURN_MS;
  return new Date(now + limit).toISOString();
}

export function isTurnExpired(deadline: string | null, now: number): boolean {
  if (!deadline) return false;
  return now > new Date(deadline).getTime() + CLOCK_GRACE_MS;
}

/** A bank clock is always `mm:ss`, including the one-hour control (`60:00`). */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * The label under one player's avatar on the score bar. Shared so the two
 * clients cannot disagree about whose time is shown and how.
 *
 * - bank: the player on turn counts down to the deadline; the other shows the
 *   bank they will start their next turn with.
 * - daily: only the player on turn has a clock, and it is the time left on this
 *   move. There is no bank to show for the other side.
 */
export function clockLabelFor(
  game: {
    status: string;
    timeControl?: string | null;
    turnDeadline: string | null;
    clocks?: Clocks | null;
  },
  slot: 1 | 2,
  active: boolean,
  now: number,
): string {
  const bank = isBankControl(game.timeControl);
  const stored = game.clocks?.[slot] ?? null;

  if (game.status === "active" && active && game.turnDeadline) {
    const left = new Date(game.turnDeadline).getTime() - now;
    return bank ? formatClock(left) : formatDailyClock(left);
  }
  return bank && stored !== null ? formatClock(stored) : "-";
}

/** `23:59:59` */
function formatDailyClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/** "10 mins, 30 mins or 1 hour" — the timed choices, for prose. */
export function bankControlsSentence(): string {
  const labels = TIME_CONTROLS.filter((c) => c.group === "bank").map((c) => c.label);
  return labels.length > 1
    ? `${labels.slice(0, -1).join(", ")} or ${labels[labels.length - 1]}`
    : (labels[0] ?? "");
}
