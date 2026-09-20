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
};

export default nextConfig;
