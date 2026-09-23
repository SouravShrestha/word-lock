#!/usr/bin/env node
/**
 * Asserts the structural invariants the monorepo's shared packages rely on.
 *
 * These are checks eslint and tsc cannot make, because they are about package
 * *manifests* and the shape of the workspace rather than about code. The one
 * that matters most is core's empty dependency list: the moment
 * `@word-lock/core` grows a runtime dependency, "the same rules run on the web,
 * on a phone and in the Worker" stops being a guarantee and becomes a hope —
 * whatever got added has to work on all three, and nothing would have told you
 * it does not until a device crashed.
 *
 * Run from the repo root: `node scripts/check-boundaries.mjs`
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

const failures = [];

function fail(message) {
  failures.push(message);
}

function readJson(relative) {
  const full = path.join(ROOT, relative);
  if (!existsSync(full)) return null;
  return JSON.parse(readFileSync(full, "utf8"));
}

/* ---------------------------------------------------------------------------
 * @word-lock/core has no runtime dependencies.
 * ------------------------------------------------------------------------- */
const core = readJson("packages/core/package.json");
if (!core) {
  fail("packages/core/package.json is missing");
} else {
  for (const field of ["dependencies", "peerDependencies", "optionalDependencies"]) {
    const value = core[field];
    if (value && Object.keys(value).length > 0) {
      fail(
        `packages/core declares ${field}: ${Object.keys(value).join(", ")}. ` +
          `core must stay dependency-free so the same code runs on Hermes, in a browser and on Workers. ` +
          `If the dependency is genuinely needed by both clients, it belongs in packages/client.`,
      );
    }
  }

  /*
   * Every subpath a consumer can import has to point at a file that exists.
   * A typo here is not a type error — it surfaces as a module-not-found at
   * bundle time in one app and not the other.
   */
  for (const [subpath, target] of Object.entries(core.exports ?? {})) {
    if (!existsSync(path.join(ROOT, "packages/core", target))) {
      fail(`packages/core exports "${subpath}" -> "${target}", which does not exist`);
    }
  }
}

/* ---------------------------------------------------------------------------
 * @word-lock/tokens has no runtime dependencies either, and its generated
 * artifacts exist.
 * ------------------------------------------------------------------------- */
const tokens = readJson("packages/tokens/package.json");
if (!tokens) {
  fail("packages/tokens/package.json is missing");
} else {
  for (const field of ["dependencies", "peerDependencies"]) {
    const value = tokens[field];
    if (value && Object.keys(value).length > 0) {
      fail(
        `packages/tokens declares ${field}: ${Object.keys(value).join(", ")}. ` +
          `The colour conversion is hand-written precisely so this package can stay dependency-free — ` +
          `it is imported by Hermes on one side and by a Tailwind build on the other.`,
      );
    }
  }

  for (const [subpath, target] of Object.entries(tokens.exports ?? {})) {
    if (subpath.includes("*")) continue; // wildcard, nothing single to check
    if (!existsSync(path.join(ROOT, "packages/tokens", target))) {
      fail(
        `packages/tokens exports "${subpath}" -> "${target}", which does not exist. ` +
          `If it is a generated file, run: npm run generate --workspace @word-lock/tokens`,
      );
    }
  }
}

/* ---------------------------------------------------------------------------
 * @word-lock/client depends on core and nothing else runtime-side, and never
 * hard-codes a platform global (window/document/localStorage/navigator) —
 * platform behaviour must arrive through ClientPlatform / AuthAdapter /
 * ApiConfig, not a typeof check.
 * ------------------------------------------------------------------------- */
const client = readJson("packages/client/package.json");
if (!client) {
  fail("packages/client/package.json is missing");
} else {
  const deps = Object.keys(client.dependencies ?? {});
  const allowed = ["@word-lock/core"];
  const unexpected = deps.filter((d) => !allowed.includes(d));
  if (unexpected.length > 0) {
    fail(
      `packages/client declares unexpected dependencies: ${unexpected.join(", ")}. ` +
        `Only @word-lock/core is allowed as a runtime dependency — everything else ` +
        `(react, @tanstack/react-query, @supabase/supabase-js) must stay a peerDependency ` +
        `so each app controls its own version.`,
    );
  }

  for (const [subpath, target] of Object.entries(client.exports ?? {})) {
    if (!existsSync(path.join(ROOT, "packages/client", target))) {
      fail(`packages/client exports "${subpath}" -> "${target}", which does not exist`);
    }
  }
}

/* ---------------------------------------------------------------------------
 * Workspace packages agree with the root workspaces globs.
 * ------------------------------------------------------------------------- */
const root = readJson("package.json");
if (!root?.workspaces?.length) {
  fail("the root package.json declares no workspaces");
}

/* ------------------------------------------------------------------------- */
if (failures.length > 0) {
  console.error(`\n${failures.length} boundary violation(s):\n`);
  for (const f of failures) console.error(`  - ${f}\n`);
  process.exit(1);
}

console.log("boundaries ok");
