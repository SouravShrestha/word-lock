import { describe, expect, it } from "vitest";

import { oklchToRgb, overshootOf, parseColor, srgbOvershoot, toNativeColor } from "./color";

function srgbToLinear(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(channel: number): number {
  return channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055;
}

describe("oklchToRgb", () => {
  it("maps the achromatic endpoints exactly", () => {
    expect(oklchToRgb(1, 0, 0)).toEqual({ r: 255, g: 255, b: 255 });
    expect(oklchToRgb(0, 0, 0)).toEqual({ r: 0, g: 0, b: 0 });
  });

  /*
   * sRGB mid-grey is the standard sanity anchor for an OKLab implementation: its
   * OKLab lightness is ~0.6, not 0.5, and an implementation that skips the cube
   * root or uses a 2.2 gamma approximation misses it visibly.
   */
  it("round-trips sRGB mid-grey through its OKLab lightness", () => {
    const lightness = Math.cbrt(srgbToLinear(0x80 / 255));
    expect(lightness).toBeCloseTo(0.5999, 4);
    expect(oklchToRgb(lightness, 0, 0)).toEqual({ r: 128, g: 128, b: 128 });
  });

  it.each([0.14, 0.22, 0.45, 0.6, 0.93, 0.955, 0.98])(
    "follows luminance = L^3 for the achromatic token L=%s",
    (l) => {
      const expected = Math.round(linearToSrgb(l ** 3) * 255);
      expect(oklchToRgb(l, 0, 0)).toEqual({ r: expected, g: expected, b: expected });
    },
  );

  /*
   * Hand-computed via the OKLab matrices for oklch(0.9 0.19 100) — the `--sun`
   * and light `--primary` token. h=100deg gives a=-0.03299, b=0.18711;
   * l'=0.927303 m'=0.891535 s'=0.661282; rLin=0.97320 gLin=0.738932
   * bLin=-0.007749, and that negative blue is the out-of-gamut clamp this
   * palette actually depends on.
   */
  it("matches a hand-computed chromatic conversion, including the gamut clamp", () => {
    expect(oklchToRgb(0.9, 0.19, 100)).toEqual({ r: 252, g: 223, b: 0 });
  });

  it("clamps out-of-gamut chroma instead of wrapping or returning NaN", () => {
    const wild = oklchToRgb(0.6, 0.4, 20);
    for (const channel of [wild.r, wild.g, wild.b]) {
      expect(Number.isFinite(channel)).toBe(true);
      expect(channel).toBeGreaterThanOrEqual(0);
      expect(channel).toBeLessThanOrEqual(255);
    }
  });
});

describe("parseColor", () => {
  it("reads hex in 3, 4, 6 and 8 digit forms", () => {
    expect(parseColor("#fff")).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(parseColor("#29a8f0")).toEqual({ r: 41, g: 168, b: 240, a: 1 });
    expect(parseColor("#0000")).toEqual({ r: 0, g: 0, b: 0, a: 0 });
    expect(parseColor("#12345678")).toEqual({ r: 18, g: 52, b: 86, a: 120 / 255 });
  });

  it("reads the space-and-slash rgb() form the border tokens use", () => {
    expect(parseColor("rgb(15 20 25 / 12%)")).toEqual({ r: 15, g: 20, b: 25, a: 0.12 });
  });

  it("reads comma-separated rgba() too", () => {
    expect(parseColor("rgba(15, 20, 25, 0.5)")).toEqual({ r: 15, g: 20, b: 25, a: 0.5 });
  });

  it("treats transparent as fully transparent black", () => {
    expect(parseColor("transparent")).toEqual({ r: 0, g: 0, b: 0, a: 0 });
  });

  it("accepts percentage lightness and chroma in oklch()", () => {
    expect(parseColor("oklch(100% 0 0)")).toEqual({ r: 255, g: 255, b: 255, a: 1 });
  });

  it("throws on a var() reference rather than guessing", () => {
    expect(() => parseColor("var(--background)")).toThrow(/resolve it before converting/);
  });

  it("throws on notations the token set does not use", () => {
    expect(() => parseColor("hsl(200 50% 50%)")).toThrow(/Cannot parse colour/);
    expect(() => parseColor("rebeccapurple")).toThrow(/Cannot parse colour/);
    expect(() => parseColor("")).toThrow(/Cannot parse colour/);
  });
});

describe("srgbOvershoot / overshootOf", () => {
  it("reports zero for colours that fit", () => {
    expect(srgbOvershoot(0.5, 0, 0)).toBe(0);
    expect(overshootOf("#29a8f0")).toBe(0);
    expect(overshootOf("rgb(15 20 25 / 12%)")).toBe(0);
    expect(overshootOf("transparent")).toBe(0);
  });

  it("flags the player colours as out of gamut", () => {
    expect(overshootOf("oklch(0.66 0.25 20)")).toBeGreaterThan(0.05); // light --p1
    expect(overshootOf("oklch(0.93 0.05 20)")).toBeGreaterThan(0.05); // light --p1-soft
    expect(overshootOf("oklch(0.93 0.05 255)")).toBeGreaterThan(0.05); // light --p2-soft
  });

  it("grows as chroma pushes further out", () => {
    const modest = overshootOf("oklch(0.6 0.1 20)");
    const wild = overshootOf("oklch(0.6 0.4 20)");
    expect(wild).toBeGreaterThan(modest);
  });
});

describe("toNativeColor", () => {
  it("emits #rrggbb for opaque colours", () => {
    expect(toNativeColor("oklch(1 0 0)")).toBe("#ffffff");
    expect(toNativeColor("#29a8f0")).toBe("#29a8f0");
    expect(toNativeColor("#FFF")).toBe("#ffffff");
  });

  it("emits rgba() when there is transparency, since RN styles read better that way", () => {
    expect(toNativeColor("rgb(15 20 25 / 12%)")).toBe("rgba(15, 20, 25, 0.12)");
  });

  it("passes the transparent keyword through", () => {
    expect(toNativeColor("transparent")).toBe("transparent");
  });

  it("zero-pads single-digit channels", () => {
    expect(toNativeColor("#010203")).toBe("#010203");
  });
});
