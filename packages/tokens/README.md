# @word-lock/tokens

The design tokens, authored once in `src/tokens.ts` and emitted in two shapes.

## Why this exists

The colours used to live in the `:root` and `.dark` blocks of the web app's
`globals.css`. React Native has neither CSS custom properties nor `oklch()`, so
the mobile app cannot read that file — and a second hand-maintained copy of
forty-five colours is a guarantee the two will drift apart.

## Editing a colour

1. Change `src/tokens.ts`.
2. `npm run generate --workspace @word-lock/tokens`
3. Commit both the source and the regenerated files in `generated/`.

`src/tokens.test.ts` fails if `generated/` is stale, so a forgotten step 2 breaks
CI rather than shipping a mismatch between the two platforms.

## What gets generated

| File                         | Consumed by                                  | Contents                                                        |
| ---------------------------- | -------------------------------------------- | --------------------------------------------------------------- |
| `generated/tokens.css`       | `globals.css`, via `@import`                 | The `:root`/`.dark` custom-property blocks, values **verbatim** |
| `generated/tokens.native.ts` | the Expo app, via `@word-lock/tokens/native` | Every token resolved to sRGB, plus the radius scale in points   |

The artifacts are committed rather than built on demand. Tailwind needs to
`@import` a real file with no build step in front of it, and a committed artifact
makes a palette change a reviewable diff in colours instead of an invisible
change to a script.

Tailwind's `@theme inline` mapping stays in `globals.css`. Which tokens become
utilities is a Tailwind concern, not a token one.

## Notation

Values are **not** normalised. `oklch()` stays where the design used it, hex
where the design used hex. Re-authoring by eye would silently change the
palette; conversion happens on the way out instead.

`src/color.ts` implements OKLCH → sRGB by hand (OKLab matrices plus the real
piecewise sRGB transfer function) rather than depending on `culori`, so this
package stays dependency-free in the same spirit as `@word-lock/core`. It
supports exactly the notations the token set uses and **throws on anything
else**, including `var()` references — a silently wrong colour is worse than a
failed build.

## The one thing the two platforms cannot agree on

Sixteen token/theme pairs are authored outside the sRGB gamut, including `--p1`,
`--p1-soft` and `--p2-soft` — the player colours, which carry whose tiles are
whose. A browser on a P3 display renders those as authored. React Native has no
portable wide-gamut colour input, so the app gets the nearest sRGB colour and
those swatches are a little less vivid on a phone.

This is inherent, not a bug in the conversion. Every affected value carries a
`// clamped from oklch(...)` annotation in `generated/tokens.native.ts` so it is
visible at the point of use rather than discovered as "the reds look flatter on
my phone".

## Requirements

`scripts/generate.mjs` imports the TypeScript source directly via Node's
`--experimental-strip-types`, which needs Node >= 22.6. The alternative was
compiling this package first, which would have put a build step in front of
every Tailwind run.
