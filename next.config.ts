import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  devIndicators: false,
  outputFileTracingRoot: path.join(__dirname, "./"),
  experimental: {
    // Enable React 19 features
    reactCompiler: false,
  },
};

export default nextConfig;
