import { describe, expect, it } from "vitest";
import { computeStats, MAX_RECENT_GAMES, type StatsGameInput } from "./stats";
import type { PlayerRow } from "./service.server";

const ME = "player-me";
const OPP_A = "player-opp-a";
const OPP_B = "player-opp-b";

const players: PlayerRow[] = [
  { id: ME, session_id: "s-me", display_name: "Me" },
  { id: OPP_A, session_id: "s-a", display_name: "Alice" },
  { id: OPP_B, session_id: "s-b", display_name: "Bob" },
];

function game(overrides: Partial<StatsGameInput> & { id: string }): StatsGameInput {
  return {
    room_code: "ABCDE",
    player1_id: ME,
    player2_id: OPP_A,
    status: "completed",
    winner_id: null,
    last_move_at: "2024-01-01T00:00:00.000Z",
    scores: { 1: 13, 2: 12 },
    ...overrides,
  };
}

describe("computeStats", () => {
  it("returns empty stats for an empty game list", () => {
    const stats = computeStats(ME, [], players);
    expect(stats.overview).toEqual({ wins: 0, losses: 0, draws: 0, total: 0 });
    expect(stats.recentGames).toEqual([]);
  });

  it("counts a win when the player is player1 and is the winner", () => {
    const games = [
      game({
        id: "g1",
        player1_id: ME,
        player2_id: OPP_A,
        winner_id: ME,
        scores: { 1: 15, 2: 10 },
      }),
    ];
    const stats = computeStats(ME, games, players);
    expect(stats.overview).toEqual({ wins: 1, losses: 0, draws: 0, total: 1 });
    expect(stats.recentGames[0]).toMatchObject({
      opponentId: OPP_A,
      opponentName: "Alice",
      yourScore: 15,
      opponentScore: 10,
      result: "win",
    });
  });

  it("counts a loss when the player is player2 and the opponent wins", () => {
    const games = [
      game({
        id: "g1",
        player1_id: OPP_A,
        player2_id: ME,
        winner_id: OPP_A,
        scores: { 1: 20, 2: 5 },
      }),
    ];
    const stats = computeStats(ME, games, players);
    expect(stats.overview).toEqual({ wins: 0, losses: 1, draws: 0, total: 1 });
    expect(stats.recentGames[0]).toMatchObject({
      opponentId: OPP_A,
      opponentName: "Alice",
      yourScore: 5,
      opponentScore: 20,
      result: "loss",
    });
  });

  it("counts a draw when winner_id is null", () => {
    const games = [game({ id: "g1", winner_id: null, scores: { 1: 12, 2: 13 } })];
    const stats = computeStats(ME, games, players);
    expect(stats.overview).toEqual({ wins: 0, losses: 0, draws: 1, total: 1 });
    expect(stats.recentGames[0].result).toBe("draw");
  });

  it("sorts recent games by completedAt descending", () => {
    const games = [
      game({ id: "g1", last_move_at: "2024-01-01T00:00:00.000Z", winner_id: ME }),
      game({ id: "g2", last_move_at: "2024-03-01T00:00:00.000Z", winner_id: ME }),
      game({ id: "g3", last_move_at: "2024-02-01T00:00:00.000Z", winner_id: ME }),
    ];
    const stats = computeStats(ME, games, players);
    expect(stats.recentGames.map((h) => h.gameId)).toEqual(["g2", "g3", "g1"]);
  });

  it("caps recent games at MAX_RECENT_GAMES, but keeps overview counts for all games", () => {
    const games = Array.from({ length: MAX_RECENT_GAMES + 3 }, (_, i) =>
      game({
        id: `g${i}`,
        last_move_at: new Date(2024, 0, i + 1).toISOString(),
        winner_id: ME,
      }),
    );
    const stats = computeStats(ME, games, players);
    expect(stats.overview.total).toBe(MAX_RECENT_GAMES + 3);
    expect(stats.recentGames).toHaveLength(MAX_RECENT_GAMES);
    // Most recent games (highest date) are kept.
    expect(stats.recentGames.map((h) => h.gameId)).toEqual(["g7", "g6", "g5", "g4", "g3"]);
  });

  it("ignores games the player is not part of", () => {
    const games = [game({ id: "g1", player1_id: OPP_A, player2_id: OPP_B, winner_id: OPP_A })];
    const stats = computeStats(ME, games, players);
    expect(stats.overview.total).toBe(0);
  });

  it("ignores non-completed games", () => {
    const games = [game({ id: "g1", status: "active", winner_id: null })];
    const stats = computeStats(ME, games, players);
    expect(stats.overview.total).toBe(0);
  });

  it("falls back to 'Unknown' when the opponent player row is missing", () => {
    const games = [game({ id: "g1", player1_id: ME, player2_id: "ghost-id", winner_id: ME })];
    const stats = computeStats(ME, games, players);
    expect(stats.recentGames[0].opponentName).toBe("Unknown");
  });
});
