export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * The sRGB transfer function ("gamma encoding"), per IEC 61966-2-1.
 *
 * Not a plain `x ** (1/2.2)`: the real curve is linear near black, which is why
 * the piecewise threshold is here. Using the approximation instead visibly
 * lifts dark colours, and this palette has several (`--background: #131f24` in
 * dark, `--p1-soft: oklch(0.22 0.05 20)`).
 */
function linearToSrgb(channel: number): number {
  return channel <= 0.0031308 ? channel * 12.92 : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055;
}

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

/**
 * Converts OKLCH to sRGB.
 *
 * OKLCH is OKLab in cylindrical form, so this is: polar to Cartesian, then
 * Björn Ottosson's OKLab -> linear sRGB matrices, then gamma encode. The
 * matrices are his published constants.
 *
 * Out-of-gamut inputs are clamped per channel. That is a real lossy step, and
 * it is why `oklch.test.ts` asserts the specific token values round-trip to the
 * colours the design actually expects rather than trusting the maths in the
 * abstract — a clamp on a wide-gamut token would shift a hue without any error.
 */
export function oklchToRgb(l: number, c: number, hDegrees: number): Omit<Rgba, "a"> {
  const h = (hDegrees * Math.PI) / 180;
  const a = c * Math.cos(h);
  const b = c * Math.sin(h);

  // OKLab -> LMS (cube roots of the cone responses).
  const lms = [
    l + 0.3963377774 * a + 0.2158037573 * b,
    l - 0.1055613458 * a - 0.0638541728 * b,
    l - 0.0894841775 * a - 1.291485548 * b,
  ].map((v) => v * v * v);

  const [lC, mC, sC] = lms as [number, number, number];

  // LMS -> linear sRGB.
  const rLinear = 4.0767416621 * lC - 3.3077115913 * mC + 0.2309699292 * sC;
  const gLinear = -1.2684380046 * lC + 2.6097574011 * mC - 0.3413193965 * sC;
  const bLinear = -0.0041960863 * lC - 0.7034186147 * mC + 1.707614701 * sC;

  return {
    r: Math.round(clamp01(linearToSrgb(rLinear)) * 255),
    g: Math.round(clamp01(linearToSrgb(gLinear)) * 255),
    b: Math.round(clamp01(linearToSrgb(bLinear)) * 255),
  };
}

/**
 * How far outside sRGB an OKLCH colour sits, as the largest per-channel
 * overshoot in linear light. `0` means it fits.
 *
 * This matters because the palette is authored in OKLCH and sixteen of the
 * token/theme pairs do not fit in sRGB — including `--p1`, `--p1-soft` and
 * `--p2-soft`, the player colours, which are the most visually load-bearing
 * colours in the game. A browser on a P3 display renders those as authored; the
 * mobile app gets the clamped sRGB version, because React Native has no portable
 * wide-gamut colour input. So the two platforms genuinely differ on those
 * swatches, and no amount of care in the conversion changes that.
 *
 * Exposed so the generator can annotate each clamped value in
 * `generated/tokens.native.ts`. The alternative — discovering it as "the reds
 * look flatter on my phone" six screens into the port — is worse.
 */
export function srgbOvershoot(l: number, c: number, hDegrees: number): number {
  const h = (hDegrees * Math.PI) / 180;
  const a = c * Math.cos(h);
  const b = c * Math.sin(h);

  const [lC, mC, sC] = [
    l + 0.3963377774 * a + 0.2158037573 * b,
    l - 0.1055613458 * a - 0.0638541728 * b,
    l - 0.0894841775 * a - 1.291485548 * b,
  ].map((v) => v * v * v) as [number, number, number];

  const linear = [
    4.0767416621 * lC - 3.3077115913 * mC + 0.2309699292 * sC,
    -1.2684380046 * lC + 2.6097574011 * mC - 0.3413193965 * sC,
    -0.0041960863 * lC - 0.7034186147 * mC + 1.707614701 * sC,
  ];

  return Math.max(
    ...linear.map((channel) => (channel < 0 ? -channel : channel > 1 ? channel - 1 : 0)),
  );
}

const OKLCH = /^oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+%?)\s*)?\)$/i;
const RGB_SLASH = /^rgba?\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+%?)\s*)?\)$/i;
const RGB_COMMA = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+%?)\s*)?\)$/i;
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

function parseAlpha(raw: string | undefined): number {
  if (raw === undefined) return 1;
  return raw.endsWith("%") ? parseFloat(raw) / 100 : parseFloat(raw);
}

function parseRatio(raw: string): number {
  return raw.endsWith("%") ? parseFloat(raw) / 100 : parseFloat(raw);
}

function expandHex(digits: string): Rgba {
  const full =
    digits.length <= 4
      ? digits
          .split("")
          .map((d) => d + d)
          .join("")
      : digits;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
    a: full.length === 8 ? parseInt(full.slice(6, 8), 16) / 255 : 1,
  };
}

export function parseColor(value: string): Rgba {
  const input = value.trim();

  if (input === "transparent") return { r: 0, g: 0, b: 0, a: 0 };

  const hex = HEX.exec(input);
  if (hex) return expandHex(hex[1]);

  const oklch = OKLCH.exec(input);
  if (oklch) {
    const { r, g, b } = oklchToRgb(
      parseRatio(oklch[1]),
      parseRatio(oklch[2]),
      parseFloat(oklch[3]),
    );
    return { r, g, b, a: parseAlpha(oklch[4]) };
  }

  const rgb = RGB_SLASH.exec(input) ?? RGB_COMMA.exec(input);
  if (rgb) {
    return {
      r: Math.round(parseFloat(rgb[1])),
      g: Math.round(parseFloat(rgb[2])),
      b: Math.round(parseFloat(rgb[3])),
      a: parseAlpha(rgb[4]),
    };
  }

  throw new Error(
    `Cannot parse colour "${value}". ` +
      `Supported: oklch(), hex, rgb()/rgba() with space or comma separators, and "transparent". ` +
      `If this is a var() reference, resolve it before converting.`,
  );
}

function hex2(value: number): string {
  return value.toString(16).padStart(2, "0");
}

export function overshootOf(value: string): number {
  const oklch = OKLCH.exec(value.trim());
  if (!oklch) return 0;
  return srgbOvershoot(parseRatio(oklch[1]), parseRatio(oklch[2]), parseFloat(oklch[3]));
}

export function toNativeColor(value: string): string {
  const { r, g, b, a } = parseColor(value);
  if (a === 0 && r === 0 && g === 0 && b === 0) return "transparent";
  if (a >= 1) return `#${hex2(r)}${hex2(g)}${hex2(b)}`;
  return `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(4))})`;
}
