import type { NextConfig } from "next";
import path from "path";

import pkg from "./package.json";

const nextConfig: NextConfig = {
  devIndicators: false,
  outputFileTracingRoot: path.join(__dirname, "./"),
  /*
   * The version shown in Settings → About, inlined at build time from the one
   * place it is already maintained. release-please bumps package.json on every
   * release, so a hardcoded string in the UI would silently go stale and make
   * bug reports point at the wrong build.
   */
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },
  experimental: {
    // Enable React 19 features
    reactCompiler: false,
  },
  /*
   * Headers with no real cost to getting wrong, applied everywhere. A
   * Content-Security-Policy is deliberately not here: this app has an inline
   * JSON-LD `<script>` in `layout.tsx`, a Supabase Realtime websocket, and an
   * OAuth redirect flow, and a CSP wrong for any of those fails silently in
   * production rather than in a build — that needs its own pass with a
   * deployed environment to verify against, not a blind addition alongside
   * everything else here.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // This app is never meant to be framed by another site.
          { key: "X-Frame-Options", value: "DENY" },
          // Stops a misconfigured or attacker-controlled response from being
          // sniffed into a different content type than it was served with.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Sends the full path to same-origin requests (useful for our own
          // analytics/logs) but only the origin cross-origin, so a link out
          // of the app never leaks a room code or session id in the referrer.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Nothing in this app uses the camera, microphone or geolocation —
          // deny them so an embed or a compromised dependency can't ask.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Cloudflare's dashboard may already add this at the edge; setting
          // it here too means it still applies if that is ever turned off.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
