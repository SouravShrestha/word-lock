/**
 * NativeWind's Tailwind config. Deliberately Tailwind v3, not v4 — NativeWind 4
 * targets v3, and `apps/web` is the one that gets v4's newer CSS features
 * (`@theme inline`, `@custom-variant`). The two configs cannot be shared, which
 * is exactly why the *tokens themselves* live in `@word-lock/tokens` rather than
 * in either Tailwind config: this file only maps token names onto Tailwind's
 * theme shape, `src/app/globals.css` is where their actual values live for this
 * platform.
 *
 * Colours are `var(--name)` referencing custom properties NativeWind's runtime
 * resolves from `globals.css`'s `:root`/`.dark` blocks (the same mechanism the
 * web app uses, and the reason NativeWind can do dark mode via CSS variables at
 * all — see https://nativewind.dev/docs/guides/themes). `darkMode: "class"`
 * mirrors `next-themes`' `attribute: "class"` setup on the web; the same
 * three-state (light/dark/system) provider shape reappears in
 * `src/theme/ThemeProvider.tsx`.
 */
const { cssVarNames } = require("@word-lock/tokens/native");

/**
 * Tailwind colour name → the custom property NativeWind resolves at runtime.
 *
 * The Tailwind name is each token's camelCase key (`mutedForeground`,
 * `surface2`) so a class reads the same as a `colors[theme]` lookup, while the
 * declared property is kebab-case off the token's authored name
 * (`--muted-foreground`, `--surface-2`), matching the web's `tokens.css`. The
 * pairing comes from `cssVarNames`, which the token generator emits, and is
 * deliberately not reconstructed here: the two spellings are not
 * interconvertible. `camel()` maps `surface-2` to `surface2` — the uppercase of
 * a digit is itself — so converting back by splitting on capitals alone yielded
 * `var(--surface2)`, which nothing declares, and `bg-surface2` silently
 * resolved to no colour at all. Splitting letter/digit boundaries instead would
 * break `--p1`/`--p2`, which are authored without a hyphen. Only the generator
 * sees both names, so it is what supplies the map.
 */
function toCssVarColors(names) {
  const out = {};
  for (const [name, cssVar] of Object.entries(names)) out[name] = `var(${cssVar})`;
  return out;
}

/*
 * Rubik, one registered face per weight. The web loads Rubik as a variable
 * font (`next/font/google` in `apps/web/src/app/layout.tsx`), so any numeric
 * `font-weight` works there; React Native has no variable-font axis support,
 * so each weight is a separate family name registered by `useFonts` in
 * `src/app/_layout.tsx`. Keep the two lists in step.
 */
const RUBIK_FACES = {
  300: "Rubik_300Light",
  400: "Rubik_400Regular",
  500: "Rubik_500Medium",
  600: "Rubik_600SemiBold",
  700: "Rubik_700Bold",
};

/**
 * Overrides Tailwind's own `font-light` … `font-bold` utilities so each one
 * sets `fontFamily` *as well as* `fontWeight`.
 *
 * On the web `font-semibold` only has to say "600" and the variable font
 * answers. Here, `fontWeight: 600` against a single-face family is ignored on
 * Android and faux-bolded on iOS, so the weight has to be expressed by picking
 * a different family. Emitting `font-weight` alongside it is harmless and keeps
 * the intent readable in a style dump.
 *
 * Registered as a plugin rather than via `theme.extend.fontWeight` for two
 * reasons: `fontWeight` in the theme can only produce a `font-weight`
 * declaration, and plugin utilities are emitted after every core utility — so
 * `font-display font-semibold` resolves to `Rubik_600SemiBold` (weight wins,
 * matching the web, where `font-semibold` overrides the `h*` 700) instead of
 * depending on core-plugin ordering.
 */
function rubikWeights({ addUtilities }) {
  const utilities = {};
  const names = {
    300: "light",
    400: "normal",
    500: "medium",
    600: "semibold",
    700: "bold",
  };
  for (const [weight, face] of Object.entries(RUBIK_FACES)) {
    utilities[`.font-${names[weight]}`] = { fontFamily: face, fontWeight: weight };
  }
  addUtilities(utilities);
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: toCssVarColors(cssVarNames),
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "3xl": "var(--radius-3xl)",
        "4xl": "var(--radius-4xl)",
      },
      /*
       * `font-sans` is the web's body default (Rubik at weight 500 — see the
       * `body` rule in `apps/web/src/app/globals.css`), `font-display` is its
       * `h1, h2, h3` default (Rubik at 700). Both are family-only, exactly as
       * on the web; the *weight* comes from a `font-*` weight utility, which
       * the plugin below turns into the matching static face.
       */
      fontFamily: {
        sans: [RUBIK_FACES[500]],
        display: [RUBIK_FACES[700]],
      },
    },
  },
  plugins: [rubikWeights],
};
