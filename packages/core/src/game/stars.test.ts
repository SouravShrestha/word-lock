import { describe, expect, it } from "vitest";
import {
  BASE_GAIN,
  BASE_LOSS,
  BASE_STARS,
  MAX_GAIN,
  MAX_LOSS,
  MIN_GAIN,
  MIN_LOSS,
  MIN_STARS,
  SWING,
  applyDelta,
  expectedScore,
  scoreForPlayerA,
  starDeltas,
} from "./stars";

const HOPELESS = 0;
const DOMINANT = 3000;

describe("expectedScore", () => {
  it("is even between equal star counts", () => {
    expect(expectedScore(200, 200)).toBeCloseTo(0.5);
  });

  it("favours the higher star count", () => {
    expect(expectedScore(600, 200)).toBeGreaterThan(0.9);
    expect(expectedScore(200, 600)).toBeLessThan(0.1);
  });

  it("is symmetric between the two players", () => {
    expect(expectedScore(400, 200) + expectedScore(200, 400)).toBeCloseTo(1);
  });

  it("gives a 400-star lead the textbook ~0.909", () => {
    expect(expectedScore(600, 200)).toBeCloseTo(0.909, 3);
  });
});

describe("starDeltas", () => {
  it("pays the base amounts in an even match", () => {
    const { deltaA, deltaB } = starDeltas(200, 200, 1);
    expect(deltaA).toBe(BASE_GAIN);
    expect(deltaB).toBe(-BASE_LOSS);
  });

  it("is inflationary: the winner gains more than the loser drops", () => {
    const { deltaA, deltaB } = starDeltas(200, 200, 1);
    expect(deltaA + deltaB).toBeGreaterThan(0);
  });

  it("mirrors when the result flips", () => {
    const aWins = starDeltas(900, 400, 1);
    const bWins = starDeltas(900, 400, 0);
    expect(aWins.deltaA).toBeGreaterThan(0);
    expect(aWins.deltaB).toBeLessThan(0);
    expect(bWins.deltaA).toBeLessThan(0);
    expect(bWins.deltaB).toBeGreaterThan(0);
  });

  it("reads the same matchup from either side", () => {
    // B beating A must pay B exactly what A would have been paid for the
    // reverse, since both are derived from one tilt.
    const fromA = starDeltas(400, 900, 0);
    const fromB = starDeltas(900, 400, 1);
    expect(fromA.deltaB).toBe(fromB.deltaA);
    expect(fromA.deltaA).toBe(fromB.deltaB);
  });

  it("rewards an upset more than an expected win", () => {
    const upset = starDeltas(200, 1600, 1);
    const expectedWin = starDeltas(1600, 200, 1);
    expect(upset.deltaA).toBeGreaterThan(expectedWin.deltaA);
  });

  it("punishes losing to a weaker opponent more than losing to a stronger one", () => {
    const upsetVictim = starDeltas(1600, 200, 0);
    const honourableLoss = starDeltas(200, 1600, 0);
    expect(upsetVictim.deltaA).toBeLessThan(honourableLoss.deltaA);
  });

  it("holds the gain within its bounds at both extremes", () => {
    expect(starDeltas(HOPELESS, DOMINANT, 1).deltaA).toBe(MAX_GAIN);
    expect(starDeltas(DOMINANT, HOPELESS, 1).deltaA).toBe(MIN_GAIN);
  });

  it("holds the loss within its bounds at both extremes", () => {
    expect(starDeltas(DOMINANT, HOPELESS, 0).deltaA).toBe(-MAX_LOSS);
    // The raw figure for a hopeless underdog goes positive; a loss must still
    // cost something.
    expect(starDeltas(HOPELESS, DOMINANT, 0).deltaA).toBe(-MIN_LOSS);
  });

  it("never turns a loss into a gain", () => {
    for (let stars = 0; stars <= 3000; stars += 100) {
      const { deltaA } = starDeltas(stars, DOMINANT, 0);
      expect(deltaA).toBeLessThan(0);
    }
  });

  it("leaves a draw between equals untouched", () => {
    expect(starDeltas(200, 200, 0.5)).toEqual({ deltaA: 0, deltaB: 0 });
  });

  it("moves a draw in favour of the weaker player", () => {
    const { deltaA, deltaB } = starDeltas(900, 400, 0.5);
    expect(deltaA).toBeLessThan(0);
    expect(deltaB).toBeGreaterThan(0);
    expect(deltaA + deltaB).toBe(0);
  });

  it("keeps a draw to at most half the swing", () => {
    const { deltaB } = starDeltas(DOMINANT, HOPELESS, 0.5);
    expect(deltaB).toBe(SWING / 2);
  });
});

describe("applyDelta", () => {
  it("adds the delta", () => {
    expect(applyDelta(200, 20)).toBe(220);
    expect(applyDelta(200, -14)).toBe(186);
  });

  it("clamps at the star floor", () => {
    expect(applyDelta(MIN_STARS + 5, -30)).toBe(MIN_STARS);
  });

  it("starts new accounts mid-Bronze", () => {
    expect(applyDelta(BASE_STARS, 0)).toBe(BASE_STARS);
  });
});

describe("scoreForPlayerA", () => {
  it("maps the winner to a score", () => {
    expect(scoreForPlayerA("a", "a")).toBe(1);
    expect(scoreForPlayerA("a", "b")).toBe(0);
    expect(scoreForPlayerA("a", null)).toBe(0.5);
  });
});
