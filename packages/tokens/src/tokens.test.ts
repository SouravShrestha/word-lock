import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { RADIUS, TOKENS, resolve } from "./tokens";

const EXPECTED_LIGHT: Record<string, string> = {
  background: "oklch(0.98 0.015 95)",
  foreground: "oklch(0.14 0 0)",
  card: "oklch(0.98 0.015 95)",
  "card-foreground": "oklch(0.14 0 0)",
  popover: "oklch(0.98 0.015 95)",
  "popover-foreground": "oklch(0.14 0 0)",
  primary: "oklch(0.9 0.19 100)",
  "primary-foreground": "oklch(0.14 0 0)",
  secondary: "oklch(0.93 0.02 95)",
  "secondary-foreground": "oklch(0.14 0 0)",
  muted: "oklch(0.93 0.02 95)",
  "muted-foreground": "oklch(0.45 0.01 95)",
  accent: "oklch(0.82 0.15 195)",
  "accent-foreground": "oklch(0.14 0 0)",
  destructive: "oklch(0.6 0.24 27)",
  "destructive-foreground": "oklch(1 0 0)",
  border: "rgb(15 20 25 / 12%)",
  input: "rgb(15 20 25 / 12%)",
  ring: "#29a8f0",
  p1: "oklch(0.66 0.25 20)",
  "p1-deep": "oklch(0.56 0.25 20)",
  "p1-soft": "oklch(0.93 0.05 20)",
  p2: "oklch(0.65 0.19 255)",
  "p2-deep": "oklch(0.55 0.19 255)",
  "p2-soft": "oklch(0.93 0.05 255)",
  "neutral-tile": "oklch(0.98 0.015 95)",
  "neutral-tile-deep": "oklch(0.94 0.025 95)",
  sun: "oklch(0.9 0.19 100)",
  "sun-deep": "oklch(0.82 0.19 100)",
  leaf: "oklch(0.8 0.21 145)",
  "tile-text": "oklch(1 0 0)",
  surface: "oklch(0.98 0.015 95)",
  "surface-2": "oklch(0.94 0.025 95)",
  sky: "#29a8f0",
  blush: "#ff86d0",
  mint: "#17c98a",
  aqua: "#55d4e8",
  grape: "#ff6fd8",
  "on-accent": "#0f1419",
  hairline: "rgb(15 20 25 / 12%)",
  "surface-hairline": "rgb(15 20 25 / 12%)",
  board: "oklch(0.955 0.022 95)",
  "depth-sky": "#3b6fe8",
  "depth-blush": "#cc6ba6",
  "depth-sun": "#e0a600",
  "depth-mint": "#0f9e6b",
  "depth-aqua": "#2aa8bf",
  "depth-grape": "#d93fae",
  "depth-surface": "#d4d4d4",
  "depth-surface-2": "#c2c2c2",
  "depth-danger": "oklch(0.45 0.2 27)",
};

const EXPECTED_DARK: Record<string, string> = {
  background: "#131f24",
  foreground: "#f2f5f7",
  card: "#3e4852",
  "card-foreground": "#f2f5f7",
  popover: "#3e4852",
  "popover-foreground": "#f2f5f7",
  primary: "oklch(0.88 0.19 100)",
  "primary-foreground": "oklch(0 0 0)",
  secondary: "#2f3740",
  "secondary-foreground": "#f2f5f7",
  muted: "#2f3740",
  "muted-foreground": "#8793a0",
  accent: "oklch(0.78 0.15 195)",
  "accent-foreground": "oklch(0 0 0)",
  destructive: "oklch(0.62 0.24 27)",
  "destructive-foreground": "oklch(0.98 0 0)",
  border: "#37464f",
  input: "#37464f",
  ring: "#29a8f0",
  p1: "oklch(0.68 0.22 20)",
  "p1-deep": "oklch(0.58 0.22 20)",
  "p1-soft": "oklch(0.22 0.05 20)",
  p2: "oklch(0.68 0.17 255)",
  "p2-deep": "oklch(0.58 0.17 255)",
  "p2-soft": "oklch(0.22 0.05 255)",
  "neutral-tile": "#3e4852",
  "neutral-tile-deep": "#2f3740",
  sun: "oklch(0.9 0.19 100)",
  "sun-deep": "oklch(0.82 0.19 100)",
  leaf: "oklch(0.78 0.2 145)",
  "tile-text": "#131f24",
  surface: "#3e4852",
  "surface-2": "#4a5560",
  sky: "#29a8f0",
  blush: "#ff86d0",
  mint: "#17c98a",
  aqua: "#55d4e8",
  grape: "#ff6fd8",
  "on-accent": "#0f1419",
  hairline: "#37464f",
  "surface-hairline": "transparent",
  board: "#202b32",
  "depth-sky": "#3b6fe8",
  "depth-blush": "#cc6ba6",
  "depth-sun": "#e0a600",
  "depth-mint": "#0f9e6b",
  "depth-aqua": "#2aa8bf",
  "depth-grape": "#d93fae",
  "depth-surface": "#2a3138",
  "depth-surface-2": "#333c45",
  "depth-danger": "oklch(0.45 0.2 27)",
};

describe("the token set matches the pre-extraction stylesheet", () => {
  it("declares exactly the same token names, no more and no fewer", () => {
    expect(TOKENS.map((t) => t.name).sort()).toEqual(Object.keys(EXPECTED_LIGHT).sort());
  });

  it("keeps --radius", () => {
    expect(RADIUS).toBe("0.6rem");
  });

  it.each(Object.keys(EXPECTED_LIGHT))("light: --%s is unchanged", (name) => {
    expect(resolve(name, "light")).toBe(EXPECTED_LIGHT[name]);
  });

  it.each(Object.keys(EXPECTED_DARK))("dark: --%s is unchanged", (name) => {
    expect(resolve(name, "dark")).toBe(EXPECTED_DARK[name]);
  });

  it("has no duplicate token names", () => {
    const names = TOKENS.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("models the two redundantly-declared tokens as theme-invariant", () => {
    for (const name of ["ring", "on-accent"]) {
      const token = TOKENS.find((t) => t.name === name);
      expect(typeof token?.value, `${name} should be a single value`).toBe("string");
      expect(resolve(name, "light")).toBe(resolve(name, "dark"));
    }
  });
});

describe("resolve", () => {
  it("throws on an unknown token rather than emitting undefined", () => {
    expect(() => resolve("nope", "light")).toThrow(/Unknown token/);
  });
});

describe("the committed artifacts are up to date", () => {
  const generatedDir = path.join(import.meta.dirname, "..", "generated");

  it.each(["tokens.css", "tokens.native.ts", "tokens.native.css"])(
    "%s matches the generator's output",
    async (file) => {
      const { artifacts } = await import("../scripts/generate.mjs");
      const onDisk = readFileSync(path.join(generatedDir, file), "utf8");
      expect(onDisk, `${file} is stale. Run: npm run generate --workspace @word-lock/tokens`).toBe(
        artifacts[file as keyof typeof artifacts],
      );
    },
  );
});
