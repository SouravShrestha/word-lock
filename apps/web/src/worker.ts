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
import { log } from "./lib/log";

interface Env {
  APP_HOSTNAME: string;
  CRON_SECRET?: string;
}

const worker = {
  fetch: nextHandler.fetch,

  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // The route now fails closed (503) without a secret — this check just
    // keeps that misconfiguration visible in the cron trigger's own logs
    // instead of a silent no-op fetch every 30 minutes.
    if (!env.CRON_SECRET) {
      log.error("CRON_SECRET is not set; sweep will be rejected.", { handler: "scheduled" });
      return;
    }
    const url = `https://${env.APP_HOSTNAME}/api/game/sweep`;
    const headers = { Authorization: `Bearer ${env.CRON_SECRET}` };
    ctx.waitUntil(
      fetch(url, { method: "POST", headers }).catch((error) =>
        log.error("Sweep trigger failed", { handler: "scheduled", error: String(error) }),
      ),
    );
  },
};

export default worker;
