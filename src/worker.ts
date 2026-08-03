/// <reference types="@cloudflare/workers-types" />

/**
 * Cloudflare Worker entry point.
 *
 * Wraps the OpenNext handler and adds a `scheduled` export so the
 * Cloudflare Cron Trigger (configured in wrangler.toml) can fire sweeps
 * for abandoned games where neither player's tab is open.
 */

// @ts-expect-error - generated at build time by `opennextjs-cloudflare build`
import nextHandler from "../.open-next/worker.js";

interface Env {
  APP_HOSTNAME: string;
  CRON_SECRET?: string;
}

const worker = {
  fetch: nextHandler.fetch,

  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const url = `https://${env.APP_HOSTNAME}/api/game/sweep`;
    const headers: Record<string, string> = {};
    if (env.CRON_SECRET) {
      headers["Authorization"] = `Bearer ${env.CRON_SECRET}`;
    }
    ctx.waitUntil(fetch(url, { method: "POST", headers }));
  },
};

export default worker;
