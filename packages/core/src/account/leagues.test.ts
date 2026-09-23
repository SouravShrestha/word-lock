import { describe, expect, it } from "vitest";
import {
  LEAGUES,
  leagueById,
  leagueChange,
  leagueForStars,
  leagueIndex,
  progressToNext,
} from "./leagues";
import { BASE_STARS } from "../game/stars";

describe("LEAGUES", () => {
  it("has five bands in ascending order with no gaps", () => {
    expect(LEAGUES).toHaveLength(5);
    LEAGUES.forEach((league, i) => {
      if (i === 0) {
        expect(league.minStars).toBe(0);
        return;
      }
      expect(league.minStars).toBe(LEAGUES[i - 1].maxStars! + 1);
    });
    expect(LEAGUES.at(-1)!.maxStars).toBeNull();
  });
});

describe("leagueForStars", () => {
  it("places a new account mid-Bronze", () => {
    expect(leagueForStars(BASE_STARS).id).toBe("bronze");
  });

  it("reads each band's floor and ceiling", () => {
    expect(leagueForStars(0).id).toBe("bronze");
    expect(leagueForStars(399).id).toBe("bronze");
    expect(leagueForStars(400).id).toBe("silver");
    expect(leagueForStars(899).id).toBe("silver");
    expect(leagueForStars(900).id).toBe("gold");
    expect(leagueForStars(1499).id).toBe("gold");
    expect(leagueForStars(1500).id).toBe("platinum");
    expect(leagueForStars(1999).id).toBe("platinum");
    expect(leagueForStars(2000).id).toBe("diamond");
  });

  it("keeps Diamond open-ended", () => {
    expect(leagueForStars(50_000).id).toBe("diamond");
  });

  it("clamps anything at or below zero to Bronze", () => {
    expect(leagueForStars(-500).id).toBe("bronze");
  });
});

describe("leagueIndex", () => {
  it("numbers the tiers from zero", () => {
    expect(leagueIndex(0)).toBe(0);
    expect(leagueIndex(2000)).toBe(4);
  });
});

describe("leagueById", () => {
  it("round-trips every id", () => {
    LEAGUES.forEach((league) => expect(leagueById(league.id)).toBe(league));
  });
});

describe("leagueChange", () => {
  it("reports a promotion when a boundary is crossed upward", () => {
    expect(leagueChange(390, 410)).toBe("promotion");
  });

  it("reports a demotion when one is crossed downward", () => {
    expect(leagueChange(410, 390)).toBe("demotion");
  });

  it("stays quiet within a band", () => {
    expect(leagueChange(200, 220)).toBeNull();
    expect(leagueChange(220, 200)).toBeNull();
  });
});

describe("progressToNext", () => {
  it("measures the way through a band", () => {
    const p = progressToNext(200);
    expect(p.league.id).toBe("bronze");
    expect(p.next!.id).toBe("silver");
    expect(p.starsToNext).toBe(200);
    expect(p.fraction).toBeCloseTo(0.5);
  });

  it("is empty at a band's floor", () => {
    expect(progressToNext(400).fraction).toBe(0);
  });

  it("reports the top band as complete rather than endless", () => {
    const p = progressToNext(5000);
    expect(p.league.id).toBe("diamond");
    expect(p.next).toBeNull();
    expect(p.starsToNext).toBe(0);
    expect(p.fraction).toBe(1);
  });
});
