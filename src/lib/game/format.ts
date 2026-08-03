export function timeLeftLabel(deadlineIso: string): string {
  const ms = new Date(deadlineIso).getTime() - Date.now();
  const pad = (n: number) => String(n).padStart(2, "0");
  if (ms <= 0) return "00H 00M 00S";
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  return `${pad(hours)}H ${pad(minutes)}M ${pad(seconds)}S`;
}
