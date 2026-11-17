/**
 * How long a player gets to move, chosen by the host when creating a room.
 *
 * Every control is a chess-style bank: each player has a fixed amount of time
 * for the whole game, spent only while it is their turn. Running out is a loss.
 *
 * The server stores the bank each player had at the start of the current turn
 * (`pN_clock_ms`) and the turn's deadline; everything else is derived here.
 */
export type TimeControl = "5m" | "10m" | "15m";

export interface TimeControlOption {
  id: TimeControl;
  label: string;
  bankMs: number;
}

const MINUTE = 60_000;

export const TIME_CONTROLS: readonly TimeControlOption[] = [
  { id: "5m", label: "5 mins", bankMs: 5 * MINUTE },
  { id: "10m", label: "10 mins", bankMs: 10 * MINUTE },
  { id: "15m", label: "15 mins", bankMs: 15 * MINUTE },
] as const;

export const TIME_CONTROL_IDS = TIME_CONTROLS.map((c) => c.id) as [TimeControl, ...TimeControl[]];

/**
 * What a create request without a choice plays as, and what a row holding a
 * retired control (`daily`, `30m`, `60m`, kept on finished games) reads as.
 */
export const DEFAULT_TIME_CONTROL: TimeControl = "10m";

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
 * `now`. Null stays null (a finished game from before banks existed).
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
export function turnDeadlineFor(bankMs: number | null, now: number): string {
  return new Date(now + (bankMs ?? 0)).toISOString();
}

export function isTurnExpired(deadline: string | null, now: number): boolean {
  if (!deadline) return false;
  return now > new Date(deadline).getTime() + CLOCK_GRACE_MS;
}

/** A bank clock is always `mm:ss`; minutes are not capped at 59. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * The label under one player's avatar on the score bar. Shared so the two
 * clients cannot disagree about whose time is shown and how: the player on turn
 * counts down to the deadline; the other shows the bank they will start their
 * next turn with.
 */
export function clockLabelFor(
  game: {
    status: string;
    turnDeadline: string | null;
    clocks?: Clocks | null;
  },
  slot: 1 | 2,
  active: boolean,
  now: number,
): string {
  const stored = game.clocks?.[slot] ?? null;

  if (game.status === "active" && active && game.turnDeadline) {
    return formatClock(new Date(game.turnDeadline).getTime() - now);
  }
  return stored !== null ? formatClock(stored) : "-";
}

/** "5 mins, 10 mins or 15 mins" — the choices, for prose. */
export function bankControlsSentence(): string {
  const labels = TIME_CONTROLS.map((c) => c.label);
  return labels.length > 1
    ? `${labels.slice(0, -1).join(", ")} or ${labels[labels.length - 1]}`
    : (labels[0] ?? "");
}
