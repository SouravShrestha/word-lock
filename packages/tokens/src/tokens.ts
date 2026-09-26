export interface ThemedValue {
  light: string;
  dark: string;
}

export interface TokenRef {
  ref: string;
}

export type TokenValue = string | ThemedValue | { light: string; dark: TokenRef };

export interface Token {
  name: string;
  value: TokenValue;
  note?: string;
}

export interface TokenGroup {
  heading?: string;
  tokens: Token[];
}

export const RADIUS = "0.6rem";

export const TOKEN_GROUPS: TokenGroup[] = [
  {
    heading: "Semantic surfaces and text.",
    tokens: [
      { name: "background", value: { light: "oklch(0.98 0.015 95)", dark: "#131f24" } },
      { name: "foreground", value: { light: "oklch(0.14 0 0)", dark: "#f2f5f7" } },
      { name: "card", value: { light: "oklch(0.98 0.015 95)", dark: "#3e4852" } },
      { name: "card-foreground", value: { light: "oklch(0.14 0 0)", dark: "#f2f5f7" } },
      { name: "popover", value: { light: "oklch(0.98 0.015 95)", dark: "#3e4852" } },
      { name: "popover-foreground", value: { light: "oklch(0.14 0 0)", dark: "#f2f5f7" } },
      { name: "primary", value: { light: "oklch(0.9 0.19 100)", dark: "oklch(0.88 0.19 100)" } },
      { name: "primary-foreground", value: { light: "oklch(0.14 0 0)", dark: "oklch(0 0 0)" } },
      { name: "secondary", value: { light: "oklch(0.93 0.02 95)", dark: "#2f3740" } },
      { name: "secondary-foreground", value: { light: "oklch(0.14 0 0)", dark: "#f2f5f7" } },
      { name: "muted", value: { light: "oklch(0.93 0.02 95)", dark: "#2f3740" } },
      { name: "muted-foreground", value: { light: "oklch(0.45 0.01 95)", dark: "#8793a0" } },
      { name: "accent", value: { light: "oklch(0.82 0.15 195)", dark: "oklch(0.78 0.15 195)" } },
      { name: "accent-foreground", value: { light: "oklch(0.14 0 0)", dark: "oklch(0 0 0)" } },
      { name: "destructive", value: { light: "oklch(0.6 0.24 27)", dark: "oklch(0.62 0.24 27)" } },
      {
        name: "destructive-foreground",
        value: { light: "oklch(1 0 0)", dark: "oklch(0.98 0 0)" },
      },
      { name: "border", value: { light: "rgb(15 20 25 / 12%)", dark: "#37464f" } },
      { name: "nav-active", value: { light: "#ddf4ff", dark: "#202f36" } },
      { name: "nav-active-border", value: { light: "#84d8ff", dark: "#3f85a7" } },
      { name: "input", value: { light: "rgb(15 20 25 / 12%)", dark: "#37464f" } },
      {
        name: "ring",
        value: "#29a8f0",
        note: "Theme-invariant. Light and dark both declared this, identically.",
      },
    ],
  },
  {
    heading: "Board and player colours.",
    tokens: [
      { name: "p1", value: { light: "oklch(0.66 0.25 20)", dark: "oklch(0.68 0.22 20)" } },
      { name: "p1-deep", value: { light: "oklch(0.56 0.25 20)", dark: "oklch(0.58 0.22 20)" } },
      { name: "p1-soft", value: { light: "oklch(0.93 0.05 20)", dark: "oklch(0.22 0.05 20)" } },
      { name: "p2", value: { light: "oklch(0.65 0.19 255)", dark: "oklch(0.68 0.17 255)" } },
      { name: "p2-deep", value: { light: "oklch(0.55 0.19 255)", dark: "oklch(0.58 0.17 255)" } },
      { name: "p2-soft", value: { light: "oklch(0.93 0.05 255)", dark: "oklch(0.22 0.05 255)" } },
      { name: "neutral-tile", value: { light: "oklch(0.98 0.015 95)", dark: "#3e4852" } },
      { name: "neutral-tile-deep", value: { light: "oklch(0.94 0.025 95)", dark: "#2f3740" } },
      { name: "sun", value: "oklch(0.9 0.19 100)", note: "Theme-invariant." },
      { name: "sun-deep", value: "oklch(0.82 0.19 100)", note: "Theme-invariant." },
      { name: "leaf", value: { light: "oklch(0.8 0.21 145)", dark: "oklch(0.78 0.2 145)" } },
      {
        name: "tile-text",
        value: { light: "oklch(1 0 0)", dark: { ref: "background" } },
        note: "In dark mode, letters on an owned tile are the colour of the page.",
      },
    ],
  },
  {
    heading: "Flat redesign palette.",
    tokens: [
      { name: "surface", value: { light: "oklch(0.98 0.015 95)", dark: "#3e4852" } },
      { name: "surface-2", value: { light: "oklch(0.94 0.025 95)", dark: "#4a5560" } },
      { name: "sky", value: "#29a8f0", note: "Theme-invariant." },
      { name: "blush", value: "#ff86d0", note: "Theme-invariant." },
      { name: "mint", value: "#17c98a", note: "Theme-invariant." },
      { name: "aqua", value: "#55d4e8", note: "Theme-invariant." },
      { name: "grape", value: "#ff6fd8", note: "Theme-invariant." },
      {
        name: "on-accent",
        value: "#0f1419",
        note: "Theme-invariant. Light and dark both declared this, identically.",
      },
      { name: "hairline", value: { light: "rgb(15 20 25 / 12%)", dark: "#37464f" } },
      {
        name: "surface-hairline",
        value: { light: "rgb(15 20 25 / 12%)", dark: "transparent" },
        note: "Light `--surface` equals the page background, so the panel edge needs a line. Dark already contrasts, so it does not.",
      },
      {
        name: "board",
        value: { light: "oklch(0.955 0.022 95)", dark: "#202b32" },
        note: "In-game panel fill (grid tiles, word preview, played-words strip). Was `bg-card/30` at every call site; an alpha of the card colour resolves differently per theme, so the flattened result is a token. Light is a step darker than the page and a step lighter than `--surface-2`, so the edge shows without the fill competing with the owned-tile tints. Dark is #3e4852 at 30% over #131f24, flattened.",
      },
    ],
  },
  {
    heading:
      'Solid "lip" colours painted under each button fill by the soft-btn utility. Not exposed to Tailwind as colours — consumed directly as var(--depth-*).',
    tokens: [
      { name: "depth-sky", value: "#3b6fe8" },
      { name: "depth-blush", value: "#cc6ba6" },
      { name: "depth-sun", value: "#e0a600" },
      { name: "depth-mint", value: "#0f9e6b" },
      { name: "depth-aqua", value: "#2aa8bf" },
      { name: "depth-grape", value: "#d93fae" },
      { name: "depth-surface", value: { light: "#d4d4d4", dark: "#2a3138" } },
      { name: "depth-surface-2", value: { light: "#c2c2c2", dark: "#333c45" } },
      { name: "depth-danger", value: "oklch(0.45 0.2 27)" },
    ],
  },
];

export const TOKENS: Token[] = TOKEN_GROUPS.flatMap((group) => group.tokens);

export function isThemed(
  value: TokenValue,
): value is ThemedValue | { light: string; dark: TokenRef } {
  return typeof value !== "string";
}

export function isRef(value: string | TokenRef): value is TokenRef {
  return typeof value !== "string";
}

export function resolve(name: string, theme: "light" | "dark"): string {
  const token = TOKENS.find((t) => t.name === name);
  if (!token) throw new Error(`Unknown token "${name}"`);

  const raw = isThemed(token.value) ? token.value[theme] : token.value;
  if (!isRef(raw)) return raw;

  const target = TOKENS.find((t) => t.name === raw.ref);
  if (!target) {
    throw new Error(`Token "${name}" (${theme}) references "${raw.ref}", which does not exist`);
  }
  const resolved = isThemed(target.value) ? target.value[theme] : target.value;
  if (isRef(resolved)) {
    throw new Error(
      `Token "${name}" (${theme}) references "${raw.ref}", which is itself a reference. ` +
        `Token references are deliberately one level deep.`,
    );
  }
  return resolved;
}
