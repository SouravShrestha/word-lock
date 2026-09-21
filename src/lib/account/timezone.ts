/**
 * The browser's IANA timezone, sent along with game actions so the server can
 * work out where the player's local day starts.
 *
 * Streaks are "days you played", and a day boundary only means something in a
 * local timezone: a player in Kolkata finishing a game at 2am IST is playing on
 * a different date than UTC would say.
 */
export function browserTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    // Very old browsers, or a locked-down environment. The server falls back to
    // UTC when it has no timezone to work with.
    return undefined;
  }
}
