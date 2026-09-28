# Word Lock

## Overview

**Product:** Word Lock
**Surface type:** Real-time 2-player word territory game
**Audience:** Gamers and players
**Brand character:** Flat minimal design, neutral surfaces, hairline borders, extruded soft buttons, rich "lip" button depths, and a robust tabular-numeric typography system for stats and scores.

### Design Principles

- Flat minimal — Neutral surfaces, hairline borders, no depth effects beyond button extrusions.
- Playful interaction — Soft radii, solid fills, press-scale (`transform: scale(0.97)`), and soap-bubble animations.
- Shared truth — Colors are defined in `@word-lock/tokens` and resolve natively on both web (CSS) and mobile (NativeWind).

## Colors

| Token         | Light                                                                  | Dark                                                               | Role                                          |
| ------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------- |
| `--surface`   | ![#fbf9ed](https://placehold.co/15x15/fbf9ed/fbf9ed.png) `#fbf9ed`     | ![#3e4852](https://placehold.co/15x15/3e4852/3e4852.png) `#3e4852` | Background surface for cards/panels           |
| `--surface-2` | ![#f0ebd9](https://placehold.co/15x15/f0ebd9/f0ebd9.png) `#f0ebd9`     | ![#4a5560](https://placehold.co/15x15/4a5560/4a5560.png) `#4a5560` | Secondary surface                             |
| `--board`     | ![#f5f0e0](https://placehold.co/15x15/f5f0e0/f5f0e0.png) `#f5f0e0`     | ![#202b32](https://placehold.co/15x15/202b32/202b32.png) `#202b32` | In-game panel fill (grid tiles, word preview) |
| `--sky`       | ![#29a8f0](https://placehold.co/15x15/29a8f0/29a8f0.png) `#29a8f0`     | ![#29a8f0](https://placehold.co/15x15/29a8f0/29a8f0.png) `#29a8f0` | Accent (Theme-invariant)                      |
| `--blush`     | ![#ff86d0](https://placehold.co/15x15/ff86d0/ff86d0.png) `#ff86d0`     | ![#ff86d0](https://placehold.co/15x15/ff86d0/ff86d0.png) `#ff86d0` | Accent (Theme-invariant)                      |
| `--mint`      | ![#17c98a](https://placehold.co/15x15/17c98a/17c98a.png) `#17c98a`     | ![#17c98a](https://placehold.co/15x15/17c98a/17c98a.png) `#17c98a` | Accent (Theme-invariant)                      |
| `--aqua`      | ![#55d4e8](https://placehold.co/15x15/55d4e8/55d4e8.png) `#55d4e8`     | ![#55d4e8](https://placehold.co/15x15/55d4e8/55d4e8.png) `#55d4e8` | Accent (Theme-invariant)                      |
| `--grape`     | ![#ff6fd8](https://placehold.co/15x15/ff6fd8/ff6fd8.png) `#ff6fd8`     | ![#ff6fd8](https://placehold.co/15x15/ff6fd8/ff6fd8.png) `#ff6fd8` | Accent (Theme-invariant)                      |
| `--sun`       | ![#fcdf00](https://placehold.co/15x15/fcdf00/fcdf00.png) `#fcdf00`     | ![#fcdf00](https://placehold.co/15x15/fcdf00/fcdf00.png) `#fcdf00` | Accent (Theme-invariant)                      |
| `--leaf`      | ![#50df5f](https://placehold.co/15x15/50df5f/50df5f.png) `#50df5f`     | ![#51d75e](https://placehold.co/15x15/51d75e/51d75e.png) `#51d75e` | Accent                                        |
| `--p1`        | ![#ff254d](https://placehold.co/15x15/ff254d/ff254d.png) `#ff254d`     | ![#ff4a5d](https://placehold.co/15x15/ff4a5d/ff4a5d.png) `#ff4a5d` | Player 1 color                                |
| `--p2`        | ![#2a8eff](https://placehold.co/15x15/2a8eff/2a8eff.png) `#2a8eff`     | ![#4699fe](https://placehold.co/15x15/4699fe/4699fe.png) `#4699fe` | Player 2 color                                |
| `--hairline`  | ![#0f14191f](https://placehold.co/15x15/0f1419/0f1419.png) `#0f14191f` | ![#37464f](https://placehold.co/15x15/37464f/37464f.png) `#37464f` | Borders and dividers                          |

_(Note: Additional depth variables like `--depth-sky`, `--depth-blush` are used under soft buttons.)_

## Typography

**Font stack:** Rubik (`var(--font-rubik)`), system-ui, sans-serif.

| Variant           | Size   | Weight | Line Height | Usage                                        |
| ----------------- | ------ | ------ | ----------- | -------------------------------------------- |
| `tv-screen-title` | 30px   | 700    | 1.2         | Main titles                                  |
| `tv-heading`      | 18px   | 700    | 1.3         | Headings                                     |
| `tv-subheading`   | 20px   | 700    | 1.3         | Subheadings                                  |
| `tv-body-base`    | 16px   | 500    | normal      | Default body                                 |
| `tv-body`         | 14px   | 500    | normal      | Smaller body                                 |
| `tv-label`        | 15px   | 600    | normal      | UI labels                                    |
| `tv-caption`      | 13px   | 600    | normal      | Captions, metadata                           |
| `tv-eyebrow`      | 10.4px | 700    | normal      | Bold uppercase micro-label (tracking 0.06em) |
| `tv-stat`         | 36px   | 700    | 1           | Tabular nums, large stats                    |
| `tv-score`        | 30px   | 700    | 1           | Tabular nums, scores                         |

## Spacing

Uses standard Tailwind spacing scale (`0.25rem` / `4px` base unit).

## Shapes & Radii

- **`.neo` utility:** `0.9rem` (Flat panels)
- **`.soft-btn`:** `0.55rem`
- **`.soft-icon-btn`:** `0.5rem`
- **Variables:** `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-2xl`, `--radius-3xl`, `--radius-4xl`

## Elevation & Depth

Word Lock uses **solid "lip" colors** painted under each button fill, rather than offset shadows.

- Extruded buttons (`.soft-btn`) use a lip (`--btn-lip: 4px` usually, `3px` for icon buttons).
- Pressing sinks the face into the lip (`translateY`).
- Solid depths: `--depth-sky`, `--depth-blush`, `--depth-sun`, `--depth-mint`, `--depth-surface`, etc.

## Motion

- **Press Scale (`.press`):** `transform: scale(0.97)` on `:active` with `120ms ease`.
- **Soft Button Press:** `transform 80ms ease, box-shadow 80ms ease`.
- **Shimmer Sweep:** `.shimmer` class over `1.6s ease-in-out infinite`.
- **Nav Bubble Pop:** `nav-bubble-pop` over `320ms cubic-bezier(0.34, 1.56, 0.64, 1)` for tab activation.
- **Glint (`.animate-glint`):** `3s ease-in-out infinite`.

## Do's and Don'ts

### Do

- Reference tokens by Tailwind utility names or CSS variables (`var(--color-surface)`), not raw values.
- Use `.soft-btn` and `.btn-*` for all primary action buttons.
- Use `tv-*` text variants for typography rather than one-off Tailwind text classes.
- Use `.press` for interactive non-button surfaces (cards, tiles).
- Test UI in both light and dark mode as colors resolve differently.

### Don't

- Do not introduce colors outside the `@word-lock/tokens` package.
- Do not add box-shadows or gradients; keep the design flat and minimal.
- Do not use generic tailwind classes for text (e.g., `text-[15px] font-semibold`); use `tv-label`.
- Do not stack components without defining the proper interaction states (especially active pressing states).

## Component Guidelines (Example: Soft Button)

**Intent:** The primary interactive element for the game, providing satisfying tactile feedback via a solid extruded lip that sinks on press.
**Tokens:** Uses `--font-display`, `--btn-lip`, `--btn-depth`.
**States:**

- Default: Raised `4px` with solid lip.
- Active: Sinks to `1px` lip (`translateY(3px)`).
- Disabled: `opacity: 0.45` and `cursor: not-allowed`.

## Authoring Workflow

When creating or updating a component guideline for this system, follow this sequence:

1. **State the intent** — one sentence on what the component does and why it exists.
2. **Map tokens** — list every color, spacing, typography, and radius token the component uses.
3. **Define anatomy** — break the component into named parts.
4. **Specify states** — document every state: default, active (press), disabled.
5. **Describe interactions** — press feedback (usually `.press` or `.soft-btn` logic).
6. **Add accessibility criteria** — pass/fail checks.

## Definition of Done

A component is not complete until every item below is checked:

- Renders correctly in its default state.
- All states documented and visually verified (active, disabled).
- All visual values use design tokens (e.g., `var(--color-...)` or utility classes).
- Press states match the flat-minimal/extruded aesthetic.
- Tested in both Light and Dark modes.
