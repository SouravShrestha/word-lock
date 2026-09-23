import { defineConfig } from "vitest/config";
import path from "path";

/**
 * Runs plain-Node unit tests for this app's non-UI logic (platform adapters,
 * pure helpers) — not component tests, which need `jest-expo` and RN's own
 * test renderer rather than vitest's `node` environment. Task 8/9 is where the
 * first real test lands here, once `client-platform.ts` and the auth adapter
 * have logic worth testing the way `apps/web`'s equivalents already are.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    /*
     * vitest's default is to exit 1 when no test files match at all, which is
     * right for a package with tests that stopped matching by accident but
     * wrong here: this app genuinely has none yet (see the note above — Task
     * 8/9 adds the first ones), and a hard failure here was taking every other
     * workspace down with it under `turbo run test`, which aborts the whole
     * pipeline on the first non-zero exit. Remove this once a real test file
     * exists — at that point "no tests matched" becomes worth failing on
     * again.
     */
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
