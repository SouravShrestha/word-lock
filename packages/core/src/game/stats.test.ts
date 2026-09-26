import { describe, expect, it } from "vitest";
import { computeStats, MAX_HISTORY_GAMES, type StatsGameInput } from "./stats";
import type { PlayerRow } from "./rows";

const ME = "player-me";
const OPP_A = "player-opp-a";
const OPP_B = "player-opp-b";

const players: PlayerRow[] = [
  { id: ME, session_id: "s-me", username: "me", avatar: "avatar_01" },
  { id: OPP_A, session_id: "s-a", username: "alice", avatar: "avatar_03" },
  { id: OPP_B, session_id: "s-b", username: "bob", avatar: "avatar_02" },
];

function game(overrides: Partial<StatsGameInput> & { id: string }): StatsGameInput {
  return {
    room_code: "ABCDE",
    player1_id: ME,
    player2_id: OPP_A,
    status: "completed",
    winner_id: null,
    last_move_at: "2024-01-01T00:00:00.000Z",
    p1_star_delta: null,
    p2_star_delta: null,
    p1_stars_after: null,
    p2_stars_after: null,
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
      opponentName: "alice",
      opponentAvatar: "avatar_03",
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
      opponentName: "alice",
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

  it("caps the returned list at MAX_HISTORY_GAMES, but keeps overview counts for all games", () => {
    const total = MAX_HISTORY_GAMES + 3;
    const games = Array.from({ length: total }, (_, i) =>
      game({
        id: `g${i}`,
        last_move_at: new Date(2024, 0, i + 1).toISOString(),
        winner_id: ME,
      }),
    );
    const stats = computeStats(ME, games, players);
    expect(stats.overview.total).toBe(total);
    expect(stats.recentGames).toHaveLength(MAX_HISTORY_GAMES);
    expect(stats.recentGames[0].gameId).toBe(`g${total - 1}`);
    expect(stats.recentGames.at(-1)!.gameId).toBe(`g${total - MAX_HISTORY_GAMES}`);
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
    expect(stats.recentGames[0].opponentAvatar).toBeNull();
  });
});
