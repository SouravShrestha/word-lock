import { describe, expect, it } from "vitest";

import { rangeDelta, sliceRange, starHistory, STAR_RANGES, type StarPoint } from "./star-history";
import type { StatsGameInput } from "./stats";

const ME = "player-me";
const OPP = "player-opp";

const NOW = new Date("2024-06-01T12:00:00.000Z");

function rangeById(id: string) {
  return STAR_RANGES.find((r) => r.id === id)!;
}

function game(overrides: Partial<StatsGameInput> & { id: string }): StatsGameInput {
  return {
    room_code: "ABCDE",
    player1_id: ME,
    player2_id: OPP,
    status: "completed",
    winner_id: ME,
    last_move_at: "2024-05-01T00:00:00.000Z",
    p1_star_delta: null,
    p2_star_delta: null,
    p1_stars_after: null,
    p2_stars_after: null,
    scores: { 1: 13, 2: 12 },
    ...overrides,
  };
}

/** A game the viewer played in slot 1, with a snapshot recorded. */
function ranked(id: string, at: string, delta: number, after: number): StatsGameInput {
  return game({ id, last_move_at: at, p1_star_delta: delta, p1_stars_after: after });
}

describe("starHistory", () => {
  it("returns just the current total when no game carries a snapshot", () => {
    const points = starHistory(ME, [game({ id: "g1" })], 200, NOW);
    expect(points).toEqual([{ t: NOW.toISOString(), stars: 200 }]);
  });

  it("opens with the value held before the first recorded game", () => {
    const points = starHistory(ME, [ranked("g1", "2024-05-01T00:00:00.000Z", 20, 220)], 220, NOW);

    expect(points[0]).toEqual({ t: "2024-04-30T23:59:59.999Z", stars: 200 });
    expect(points[1]).toEqual({ t: "2024-05-01T00:00:00.000Z", stars: 220 });
  });

  it("ends on the player's current total", () => {
    const points = starHistory(ME, [ranked("g1", "2024-05-01T00:00:00.000Z", 20, 220)], 220, NOW);
    expect(points.at(-1)).toEqual({ t: NOW.toISOString(), stars: 220 });
  });

  it("reaches the current total even when it disagrees with the last snapshot", () => {
    // Unranked play, or history older than the snapshots, can leave the two out
    // of step. The curve still has to finish on the figure shown beside it.
    const points = starHistory(ME, [ranked("g1", "2024-05-01T00:00:00.000Z", 20, 220)], 260, NOW);
    expect(points.at(-1)!.stars).toBe(260);
  });

  it("sorts readings oldest first regardless of input order", () => {
    const points = starHistory(
      ME,
      [
        ranked("g3", "2024-05-03T00:00:00.000Z", 20, 240),
        ranked("g1", "2024-05-01T00:00:00.000Z", 20, 200),
        ranked("g2", "2024-05-02T00:00:00.000Z", 20, 220),
      ],
      240,
      NOW,
    );

    expect(points.map((p) => p.stars)).toEqual([180, 200, 220, 240, 240]);
  });

  it("reads the viewer's own slot when they are player two", () => {
    const points = starHistory(
      ME,
      [
        game({
          id: "g1",
          player1_id: OPP,
          player2_id: ME,
          p1_star_delta: 20,
          p1_stars_after: 400,
          p2_star_delta: -14,
          p2_stars_after: 186,
        }),
      ],
      186,
      NOW,
    );

    expect(points.map((p) => p.stars)).toEqual([200, 186, 186]);
  });

  it("skips games without a snapshot but keeps the ones with it", () => {
    const points = starHistory(
      ME,
      [
        game({ id: "unranked", last_move_at: "2024-05-02T00:00:00.000Z" }),
        ranked("g1", "2024-05-01T00:00:00.000Z", 20, 220),
      ],
      220,
      NOW,
    );

    expect(points).toHaveLength(3);
  });

  it("ignores games the player is not part of, and unfinished games", () => {
    const points = starHistory(
      ME,
      [
        game({ id: "other", player1_id: OPP, player2_id: "third", p1_stars_after: 500 }),
        game({ id: "live", status: "active", p1_stars_after: 500 }),
      ],
      200,
      NOW,
    );

    expect(points).toEqual([{ t: NOW.toISOString(), stars: 200 }]);
  });

  it("never derives a baseline below the star floor", () => {
    // A loss clamped at zero recorded more than it took: 0 - (-30) would read as
    // a baseline of 30, but the floor is what the player actually sat at.
    const points = starHistory(ME, [ranked("g1", "2024-05-01T00:00:00.000Z", -30, 0)], 0, NOW);
    expect(points[0].stars).toBe(0);
  });
});

describe("sliceRange", () => {
  const points: StarPoint[] = [
    { t: "2024-01-01T00:00:00.000Z", stars: 100 },
    { t: "2024-05-20T00:00:00.000Z", stars: 300 },
    { t: "2024-05-30T00:00:00.000Z", stars: 320 },
  ];

  it("returns everything for the ALL range", () => {
    expect(sliceRange(points, rangeById("all"), NOW)).toBe(points);
  });

  it("anchors the window at the value held when it opened", () => {
    const sliced = sliceRange(points, rangeById("7d"), NOW);

    expect(sliced).toHaveLength(2);
    expect(sliced[0]).toEqual({ t: "2024-05-25T12:00:00.000Z", stars: 300 });
    expect(sliced[1]).toEqual({ t: "2024-05-30T00:00:00.000Z", stars: 320 });
  });

  it("returns a flat line when no game falls inside the window", () => {
    const quiet: StarPoint[] = [
      { t: "2024-01-01T00:00:00.000Z", stars: 100 },
      { t: "2024-02-01T00:00:00.000Z", stars: 150 },
    ];
    const sliced = sliceRange(quiet, rangeById("7d"), NOW);

    expect(sliced.map((p) => p.stars)).toEqual([150]);
  });

  it("returns the whole curve when it already fits inside the window", () => {
    const recent: StarPoint[] = [{ t: "2024-05-30T00:00:00.000Z", stars: 320 }];
    expect(sliceRange(recent, rangeById("30d"), NOW)).toBe(recent);
  });

  it("handles an empty curve", () => {
    expect(sliceRange([], rangeById("30d"), NOW)).toEqual([]);
  });
});

describe("rangeDelta", () => {
  it("measures the endpoints of the slice", () => {
    expect(
      rangeDelta([
        { t: "2024-05-01T00:00:00.000Z", stars: 402 },
        { t: "2024-05-10T00:00:00.000Z", stars: 380 },
        { t: "2024-05-20T00:00:00.000Z", stars: 612 },
      ]),
    ).toBe(210);
  });

  it("is null when there is nothing to compare", () => {
    expect(rangeDelta([])).toBeNull();
    expect(rangeDelta([{ t: "2024-05-01T00:00:00.000Z", stars: 200 }])).toBeNull();
  });
});
