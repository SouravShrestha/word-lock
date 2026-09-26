import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/.open-next/**",
      "**/.next/**",
      "**/.expo/**",
      "**/.turbo/**",
      "**/next-env.d.ts",
      "**/android/**",
      "**/ios/**",
      /*
       * Generated from packages/tokens/src/tokens.ts. Reformatting a table of
       * colour literals with trailing `// clamped from …` annotations would only
       * make the diff of a palette change harder to read.
       */
      "packages/tokens/generated/**",
    ],
  },
  /*
   * next/core-web-vitals is scoped to apps/web only. Applied repo-wide it would
   * flag apps/mobile for things that make no sense off the web (no <img>, no
   * <a>, no DOM at all) — a RN screen isn't a Next page and shouldn't be linted
   * as one.
   */
  ...compat.extends("next/core-web-vitals").map((config) => ({
    ...config,
    files: ["apps/web/**/*.{ts,tsx}"],
  })),
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    /*
     * The Next app no longer sits at the config's directory, so the plugin's
     * page-directory detection has to be told where it moved. Without this,
     * rules like no-html-link-for-pages silently stop firing.
     */
    settings: {
      next: {
        rootDir: "apps/web",
      },
    },
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      // apps/web gets browser globals; apps/mobile gets its own block below
      // with globals.browser removed in favour of nothing extra — React
      // Native's globals (fetch, console, __DEV__, …) are already known to
      // typescript-eslint through @types/react-native, and adding
      // globals.browser there would incorrectly allow `window`/`document`.
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  /*
   * apps/mobile has no DOM. Same globals-scoping reasoning as core/client: a
   * `typeof window` check here would be a behaviour that quietly assumes a
   * browser, on the one app that is never running in one.
   */
  {
    files: ["apps/mobile/src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-globals": [
        "error",
        { name: "window", message: "apps/mobile has no DOM." },
        { name: "document", message: "apps/mobile has no DOM." },
        { name: "localStorage", message: "Use ClientPlatform.storage / AsyncStorage directly." },
      ],
    },
  },
  /*
   * `@word-lock/core` must stay loadable by Hermes, by the Cloudflare Workers
   * runtime and by a browser, because it is the one copy of the rules all three
   * run. Its tsconfig drops the `dom` library to catch most of this at compile
   * time, but it has to keep `@types/node` so `build-env.ts` can spell out the
   * `process.env.*` reads both bundlers substitute textually — which hands back
   * `Buffer`, `__dirname` and friends. These rules take that away again.
   *
   * This is the boundary that makes the shared-logic claim true rather than
   * aspirational, so it is worth failing a build over.
   */
  {
    files: ["packages/core/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["node:*", "fs", "path", "zlib", "crypto", "buffer", "stream"],
              message:
                "core runs on Hermes and on Workers. Node built-ins belong in a .server.ts module in apps/web.",
            },
            {
              group: ["next", "next/*", "react", "react-dom", "react-native", "react-native/*"],
              message:
                "core is framework-free. UI and framework code belongs in apps/* or in a UI package.",
            },
            {
              group: ["**/*.server", "**/*.server.*"],
              message:
                "a .server module holds the service-role key and node-only APIs. core must never reach one.",
            },
            {
              group: ["@word-lock/*"],
              message:
                "core sits at the bottom of the dependency graph and imports no other workspace package.",
            },
          ],
        },
      ],
      "no-restricted-globals": [
        "error",
        { name: "window", message: "core has no DOM. Move this to the app that needs it." },
        { name: "document", message: "core has no DOM. Move this to the app that needs it." },
        { name: "localStorage", message: "storage is injected by the app, not reached for here." },
        {
          name: "sessionStorage",
          message: "storage is injected by the app, not reached for here.",
        },
        { name: "navigator", message: "core has no DOM. Move this to the app that needs it." },
        {
          name: "fetch",
          message: "core is pure. I/O belongs in packages/client or a route handler.",
        },
        { name: "Buffer", message: "Node-only. Does not exist in Hermes." },
        { name: "__dirname", message: "Node-only. Does not exist in Hermes." },
        { name: "__filename", message: "Node-only. Does not exist in Hermes." },
        { name: "require", message: "core is ESM-only." },
      ],
    },
  },
  /*
   * `@word-lock/client` is the client/server seam both apps share. Unlike core,
   * it legitimately needs `fetch`, `Response` and the DOM lib for JSX — React
   * Native provides all of those. What it must never do is reach for something
   * only a *browser* has: `window`, `document`, `localStorage`, `navigator`.
   * Those differ enough between platforms (sync vs async storage; cookies vs no
   * cookies) that they are modelled as injected interfaces (`ClientPlatform`,
   * `AuthAdapter`, `ApiConfig`) rather than a `typeof window !== "undefined"`
   * branch — a branch here would be a behaviour the mobile app inherited
   * without anyone deciding it should.
   */
  {
    files: ["packages/client/src/**/*.{ts,tsx}"],
    ignores: ["packages/client/src/**/*.test.ts"],
    rules: {
      "no-restricted-globals": [
        "error",
        {
          name: "window",
          message: "Inject via ClientPlatform/AuthAdapter instead — this package runs on RN too.",
        },
        {
          name: "document",
          message: "Inject via ClientPlatform/AuthAdapter instead — this package runs on RN too.",
        },
        { name: "localStorage", message: "Storage comes from ClientPlatform.storage." },
        { name: "sessionStorage", message: "Storage comes from ClientPlatform.storage." },
        { name: "navigator", message: "Device facts are not this package's concern." },
      ],
    },
  },
  /*
   * `@word-lock/tokens` is loaded by Hermes too — the mobile app imports the
   * resolved colour map from it. The runtime modules get the same no-DOM
   * treatment as core, but its *tests* and its generator legitimately read files
   * (the staleness check compares the committed artifacts against a fresh
   * build), so they are exempt rather than contorted.
   */
  {
    files: ["packages/tokens/src/**/*.ts"],
    ignores: ["packages/tokens/src/**/*.test.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["node:*", "fs", "path", "next", "next/*", "react", "react-native"],
              message:
                "the runtime side of @word-lock/tokens is consumed by Hermes. Keep file and framework access in scripts/ or in a test.",
            },
          ],
        },
      ],
      "no-restricted-globals": [
        "error",
        { name: "window", message: "tokens has no DOM." },
        { name: "document", message: "tokens has no DOM." },
      ],
    },
  },
  eslintPluginPrettier,
);
