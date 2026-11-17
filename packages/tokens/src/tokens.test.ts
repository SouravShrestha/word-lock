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
  primary: "#FFC400",
  "primary-foreground": "oklch(0.14 0 0)",
  secondary: "oklch(0.93 0.02 95)",
  "secondary-foreground": "oklch(0.14 0 0)",
  muted: "oklch(0.93 0.02 95)",
  "muted-foreground": "oklch(0.45 0.01 95)",
  accent: "#FF7A00",
  "accent-foreground": "oklch(0.14 0 0)",
  destructive: "#FF3A1A",
  "destructive-foreground": "oklch(1 0 0)",
  border: "rgb(15 20 25 / 12%)",
  "nav-active": "rgb(139 30 255 / 12%)",
  "nav-active-border": "#8B1EFF",
  input: "rgb(15 20 25 / 12%)",
  ring: "#8B1EFF",
  p1: "#E40049",
  "p1-deep": "#E40049",
  "p1-soft": "#FFBFD2",
  p2: "#1F7BFF",
  "p2-deep": "#0057D9",
  "p2-soft": "#BFD8FF",
  "neutral-tile": "oklch(0.98 0.015 95)",
  "neutral-tile-deep": "oklch(0.94 0.025 95)",
  sun: "#FFC400",
  "sun-deep": "#FFA600",
  leaf: "#58CC02",
  "leaf-deep": "#3F9A00",
  "tile-text": "oklch(1 0 0)",
  surface: "oklch(0.98 0.015 95)",
  "surface-2": "oklch(0.94 0.025 95)",
  sky: "#8B1EFF",
  blush: "#8B1EFF",
  mint: "#FF7A00",
  aqua: "#8B1EFF",
  grape: "#8B1EFF",
  streak: "#FF7A00",
  freeze: "#1CB0F6",
  "freeze-deep": "#0E86C2",
  "on-accent": "#0f1419",
  hairline: "rgb(15 20 25 / 12%)",
  "surface-hairline": "rgb(15 20 25 / 12%)",
  board: "oklch(0.955 0.022 95)",
  "depth-sky": "#4B008B",
  "depth-blush": "#4B008B",
  "depth-sun": "#FFA600",
  "depth-mint": "#FF3A1A",
  "depth-aqua": "#4B008B",
  "depth-grape": "#4B008B",
  "depth-surface": "#d4d4d4",
  "depth-surface-2": "#c2c2c2",
  "depth-danger": "#E40049",
};

const EXPECTED_DARK: Record<string, string> = {
  background: "#131f24",
  foreground: "#f2f5f7",
  card: "#3e4852",
  "card-foreground": "#f2f5f7",
  popover: "#3e4852",
  "popover-foreground": "#f2f5f7",
  primary: "#FFC400",
  "primary-foreground": "oklch(0 0 0)",
  secondary: "#2f3740",
  "secondary-foreground": "#f2f5f7",
  muted: "#2f3740",
  "muted-foreground": "#8793a0",
  accent: "#FF7A00",
  "accent-foreground": "oklch(0 0 0)",
  destructive: "#FF3A1A",
  "destructive-foreground": "oklch(0.98 0 0)",
  border: "#37464f",
  "nav-active": "rgb(139 30 255 / 22%)",
  "nav-active-border": "#8B1EFF",
  input: "#37464f",
  ring: "#8B1EFF",
  p1: "#E40049",
  "p1-deep": "#E40049",
  "p1-soft": "#8A0A36",
  p2: "#3D8DFF",
  "p2-deep": "#2F78F0",
  "p2-soft": "#0F4396",
  "neutral-tile": "#3e4852",
  "neutral-tile-deep": "#2f3740",
  sun: "#FFC400",
  "sun-deep": "#FFA600",
  leaf: "#58CC02",
  "leaf-deep": "#3F9A00",
  "tile-text": "#131f24",
  surface: "#3e4852",
  "surface-2": "#4a5560",
  sky: "#8B1EFF",
  blush: "#8B1EFF",
  mint: "#FF7A00",
  aqua: "#8B1EFF",
  grape: "#8B1EFF",
  streak: "#FF7A00",
  freeze: "#1CB0F6",
  "freeze-deep": "#0E86C2",
  "on-accent": "#0f1419",
  hairline: "#37464f",
  "surface-hairline": "transparent",
  board: "#202b32",
  "depth-sky": "#4B008B",
  "depth-blush": "#4B008B",
  "depth-sun": "#FFA600",
  "depth-mint": "#FF3A1A",
  "depth-aqua": "#4B008B",
  "depth-grape": "#4B008B",
  "depth-surface": "#2a3138",
  "depth-surface-2": "#333c45",
  "depth-danger": "#E40049",
};

describe("the token set matches the pre-extraction stylesheet", () => {
  it("declares exactly the same token names, no more and no fewer", () => {
    expect(TOKENS.map((t) => t.name).sort()).toEqual(Object.keys(EXPECTED_LIGHT).sort());
  });

  it("keeps --radius", () => {
    expect(RADIUS).toBe("1rem");
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
