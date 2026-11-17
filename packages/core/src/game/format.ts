export function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/** A room code from pasted text: the bare 5-char code or an invite link ending in /game/CODE. */
export function parseRoomCode(text: string): string | null {
  const t = text.trim().toUpperCase();
  return (t.match(/\/GAME\/([A-Z0-9]{5})\b/) ?? t.match(/^([A-Z0-9]{5})$/))?.[1] ?? null;
}

/** What a code field holds after `pasted` lands on `current`: a recognised code replaces it, anything else is appended, filtered and capped. */
export function roomCodeAfterPaste(current: string, pasted: string): string {
  return (
    parseRoomCode(pasted) ??
    (current + pasted)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 5)
  );
}

export function timeLeftLabel(deadlineIso: string): string {
  const ms = new Date(deadlineIso).getTime() - Date.now();
  const pad = (n: number) => String(n).padStart(2, "0");
  if (ms <= 0) return "00H 00M 00S";
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
}
