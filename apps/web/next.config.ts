import type { NextConfig } from "next";
import { readFileSync } from "fs";
import path from "path";

const pkg = JSON.parse(readFileSync(path.join(__dirname, "../../package.json"), "utf8")) as {
  version: string;
};

const nextConfig: NextConfig = {
  devIndicators: false,
  transpilePackages: ["@word-lock/core", "@word-lock/client", "@word-lock/icons"],
  outputFileTracingRoot: path.join(__dirname, "../../"),
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },
  experimental: {
    reactCompiler: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // A scheme-less host source matches any scheme on that host, which is the
    // point here: Realtime connects over `wss://`, everything else over
    // `https://`, and a CSP source pinned to one scheme would silently block
    // the other.
    const supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : "";

    const csp = [
      "default-src 'self'",
      // Next inlines its hydration bootstrap script; a nonce-based CSP would
      // need per-request header generation, which the static `headers()`
      // config here can't do, so 'unsafe-inline' is the pragmatic middle
      // ground until a nonce plumbing pass is worth the complexity.
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: ${supabaseHost}`.trim(),
      `connect-src 'self' ${supabaseHost}`.trim(),
      "font-src 'self' data:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
