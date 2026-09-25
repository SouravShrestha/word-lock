/**
 * Minimal structured logging. Cloudflare Workers ships console output to
 * whatever log sink `wrangler tail`/the dashboard is wired to, so structure
 * here (rather than a raw string) is what makes those logs filterable without
 * a dedicated APM — a real one (Sentry et al.) is a follow-up that needs an
 * external account/DSN this repo doesn't have configured.
 */
type LogFields = Record<string, unknown>;

function emit(level: "info" | "warn" | "error", message: string, fields?: LogFields) {
  const entry = { level, message, time: new Date().toISOString(), ...fields };
  const line = JSON.stringify(entry);

  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  info: (message: string, fields?: LogFields) => emit("info", message, fields),
  warn: (message: string, fields?: LogFields) => emit("warn", message, fields),
  error: (message: string, fields?: LogFields) => emit("error", message, fields),
};
