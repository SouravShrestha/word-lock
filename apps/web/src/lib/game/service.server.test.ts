import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Caller } from "./identity.server";

interface FakeGame {
  id: string;
  room_code: string;
  status: "waiting" | "active" | "completed";
  player1_id: string;
  player2_id: string | null;
  winner_id: string | null;
  end_reason: string | null;
  grid: string;
  current_turn_player_id: string | null;
  last_move_at: string;
  p1_star_delta: number | null;
  p2_star_delta: number | null;
  p1_stars_after: number | null;
  p2_stars_after: number | null;
}

interface FakePlayer {
  id: string;
  session_id: string;
  user_id: string | null;
  username: string | null;
  avatar: string;
  stars: number;
  peak_stars: number;
  star_games: number;
  timezone: string | null;
}

let players: FakePlayer[];
let games: FakeGame[];
let moves: unknown[];
let rpcCalls: Array<{ fn: string; args: unknown }>;

function game(overrides: Partial<FakeGame>): FakeGame {
  return {
    id: overrides.id ?? `game-${games.length + 1}`,
    room_code: "ABCDE",
    status: "active",
    player1_id: "p1",
    player2_id: "p2",
    winner_id: null,
    end_reason: null,
    grid: "A".repeat(25),
    current_turn_player_id: "p1",
    last_move_at: new Date().toISOString(),
    p1_star_delta: null,
    p2_star_delta: null,
    p1_stars_after: null,
    p2_stars_after: null,
    ...overrides,
  };
}

function player(overrides: Partial<FakePlayer>): FakePlayer {
  return {
    id: "p1",
    session_id: "s1",
    user_id: null,
    username: null,
    avatar: "avatar_01",
    stars: 200,
    peak_stars: 200,
    star_games: 0,
    timezone: "UTC",
    ...overrides,
  };
}

type FakeRow = FakePlayer | FakeGame | Record<string, unknown>;

function makeQuery(rows: FakeRow[], backing: FakeRow[]) {
  let filtered = rows;
  let pendingUpdate: Record<string, unknown> | null = null;
  let pendingDelete = false;

  const builder = {
    select: () => builder,
    eq(column: string, value: unknown) {
      filtered = filtered.filter((r) => (r as Record<string, unknown>)[column] === value);
      return builder;
    },
    neq(column: string, value: unknown) {
      filtered = filtered.filter((r) => (r as Record<string, unknown>)[column] !== value);
      return builder;
    },
    is(column: string, value: null) {
      filtered = filtered.filter((r) => ((r as Record<string, unknown>)[column] ?? null) === value);
      return builder;
    },
    in(column: string, values: unknown[]) {
      filtered = filtered.filter((r) => values.includes((r as Record<string, unknown>)[column]));
      return builder;
    },
    or(expr: string) {
      const clauses = expr.split(",").map((c) => {
        const [column, , value] = c.split(".");
        return { column, value };
      });
      filtered = filtered.filter((r) =>
        clauses.some((c) => String((r as Record<string, unknown>)[c.column]) === c.value),
      );
      return builder;
    },
    update(patch: Record<string, unknown>) {
      pendingUpdate = patch;
      return builder;
    },
    delete() {
      pendingDelete = true;
      return builder;
    },
    order() {
      return builder;
    },
    async maybeSingle() {
      this._commit();
      return { data: filtered[0] ?? null, error: null };
    },
    async single() {
      this._commit();
      if (!filtered[0]) return { data: null, error: { message: "no rows" } };
      return { data: filtered[0], error: null };
    },
    then(resolve: (v: { data: FakeRow[] | null; error: null }) => void) {
      this._commit();
      resolve({ data: filtered, error: null });
    },
    _commit() {
      if (pendingUpdate) {
        for (const row of filtered) Object.assign(row, pendingUpdate);
      }
      if (pendingDelete) {
        const ids = new Set(filtered.map((r) => (r as { id: string }).id));
        const kept = backing.filter((r) => !ids.has((r as { id: string }).id));
        backing.length = 0;
        backing.push(...kept);
      }
    },
  };
  return builder;
}

vi.mock("@/integrations/supabase/client.server", () => ({
  getSupabaseAdmin: () => ({
    from(table: "wl_players" | "wl_games" | "wl_moves") {
      if (table === "wl_players") return makeQuery(players, players);
      if (table === "wl_games") return makeQuery(games, games);
      return makeQuery(moves as Record<string, unknown>[], moves as Record<string, unknown>[]);
    },
    rpc(fn: string, args: unknown) {
      rpcCalls.push({ fn, args });
      if (fn === "wl_delete_account") {
        const { p_user_id } = args as { p_user_id: string };
        for (const p of players)
          if (p.user_id === p_user_id) Object.assign(p, { user_id: null, username: null });
      }
      return Promise.resolve({ data: null, error: null });
    },
    auth: {
      admin: {
        deleteUser: () => Promise.resolve({ error: null }),
      },
    },
  }),
}));

vi.mock("./dictionary.server", () => ({
  getDictionary: () => new Set<string>(),
  isWord: () => false,
}));

vi.mock("./streak.server", () => ({ touchPlayStreak: vi.fn() }));

function callerFor(p: FakePlayer): Caller {
  return { sessionId: p.session_id, userId: p.user_id, timezone: "UTC" };
}

describe("deleteAccount", () => {
  beforeEach(() => {
    rpcCalls = [];
    moves = [];
  });

  it("rejects a guest — there is no auth account to delete", async () => {
    players = [player({ id: "guest-1", session_id: "s-guest", user_id: null })];
    games = [];

    const { deleteAccount } = await import("./service.server");
    await expect(deleteAccount(callerFor(players[0]))).rejects.toThrow(
      "Log in to delete your account.",
    );
    expect(rpcCalls).toHaveLength(0);
  }, 10000);

  it("destroys a waiting lobby the caller created, rather than forfeiting it", async () => {
    players = [
      player({ id: "p1", session_id: "s1", user_id: "u1" }),
      player({ id: "opp", session_id: "s-opp", user_id: "u-opp" }),
    ];
    games = [
      game({ id: "g1", room_code: "WAITA", status: "waiting", player1_id: "p1", player2_id: null }),
    ];

    const { deleteAccount } = await import("./service.server");
    await deleteAccount(callerFor(players[0]));

    expect(games).toHaveLength(0);
  });

  it("leaves a lobby the caller joined, without touching the creator's game", async () => {
    players = [
      player({ id: "creator", session_id: "s-c", user_id: "u-c" }),
      player({ id: "p1", session_id: "s1", user_id: "u1" }),
    ];
    games = [
      game({
        id: "g1",
        room_code: "WAITB",
        status: "waiting",
        player1_id: "creator",
        player2_id: "p1",
      }),
    ];

    const { deleteAccount } = await import("./service.server");
    await deleteAccount(callerFor(players[1]));

    expect(games).toHaveLength(1);
    expect(games[0].player2_id).toBeNull();
    expect(games[0].status).toBe("waiting");
  });

  it("forfeits an active game as a real, scored result rather than deleting it", async () => {
    players = [
      player({ id: "p1", session_id: "s1", user_id: "u1", stars: 200 }),
      player({ id: "p2", session_id: "s2", user_id: "u2", stars: 200 }),
    ];
    games = [
      game({ id: "g1", room_code: "ACTIV", status: "active", player1_id: "p1", player2_id: "p2" }),
    ];

    const { deleteAccount } = await import("./service.server");
    await deleteAccount(callerFor(players[0]));

    expect(games).toHaveLength(1);
    expect(games[0].status).toBe("completed");
    expect(games[0].end_reason).toBe("forfeit");
    expect(games[0].winner_id).toBe("p2");
  });

  it("handles every unfinished game shape in one call: waiting-as-creator, waiting-as-joiner, active", async () => {
    players = [
      player({ id: "p1", session_id: "s1", user_id: "u1" }),
      player({ id: "opp-a", session_id: "s-a", user_id: "u-a" }),
      player({ id: "opp-b", session_id: "s-b", user_id: "u-b" }),
      player({ id: "creator", session_id: "s-cr", user_id: "u-cr" }),
    ];
    games = [
      game({ id: "g1", room_code: "OWNED", status: "waiting", player1_id: "p1", player2_id: null }),
      game({
        id: "g2",
        room_code: "JOINE",
        status: "waiting",
        player1_id: "creator",
        player2_id: "p1",
      }),
      game({
        id: "g3",
        room_code: "ACTV1",
        status: "active",
        player1_id: "p1",
        player2_id: "opp-a",
      }),
      game({
        id: "g4",
        room_code: "ACTV2",
        status: "active",
        player1_id: "opp-b",
        player2_id: "p1",
      }),
      game({
        id: "g5",
        room_code: "OTHER",
        status: "active",
        player1_id: "opp-a",
        player2_id: "opp-b",
      }),
    ];

    const { deleteAccount } = await import("./service.server");
    await deleteAccount(callerFor(players[0]));

    const byRoom = Object.fromEntries(games.map((g) => [g.room_code, g]));
    expect(byRoom.OWNED).toBeUndefined();
    expect(byRoom.JOINE.player2_id).toBeNull();
    expect(byRoom.JOINE.status).toBe("waiting");
    expect(byRoom.ACTV1.status).toBe("completed");
    expect(byRoom.ACTV1.winner_id).toBe("opp-a");
    expect(byRoom.ACTV2.status).toBe("completed");
    expect(byRoom.ACTV2.winner_id).toBe("opp-b");
    expect(byRoom.OTHER.status).toBe("active");
  });

  it("detaches the player row from the auth account via wl_delete_account", async () => {
    players = [player({ id: "p1", session_id: "s1", user_id: "u1", username: "alice" })];
    games = [];

    const { deleteAccount } = await import("./service.server");
    const result = await deleteAccount(callerFor(players[0]));

    expect(result).toEqual({ ok: true });
    expect(rpcCalls).toEqual([{ fn: "wl_delete_account", args: { p_user_id: "u1" } }]);
    expect(players[0].user_id).toBeNull();
    expect(players[0].username).toBeNull();
  });

  it("never deletes the wl_players row itself", async () => {
    players = [player({ id: "p1", session_id: "s1", user_id: "u1" })];
    games = [
      game({ id: "g1", room_code: "ACTIV", status: "active", player1_id: "p1", player2_id: "p2" }),
    ];

    const { deleteAccount } = await import("./service.server");
    await deleteAccount(callerFor(players[0]));

    expect(players.some((p) => p.id === "p1")).toBe(true);
  });

  it("leaves an opponent's own game history alone — their row and the completed game both survive", async () => {
    players = [
      player({ id: "p1", session_id: "s1", user_id: "u1" }),
      player({ id: "opp", session_id: "s-opp", user_id: "u-opp", username: "bob", stars: 250 }),
    ];
    games = [
      game({ id: "g1", room_code: "ACTIV", status: "active", player1_id: "p1", player2_id: "opp" }),
    ];

    const { deleteAccount } = await import("./service.server");
    await deleteAccount(callerFor(players[0]));

    const opponent = players.find((p) => p.id === "opp")!;
    expect(opponent.username).toBe("bob");
    expect(opponent.user_id).toBe("u-opp");
    expect(games[0].status).toBe("completed");
    expect(games[0].player2_id).toBe("opp");
  });
});

describe("taking a seat requires a named account", () => {
  beforeEach(() => {
    rpcCalls = [];
    moves = [];
  });

  it("rejects a guest joining from an invite link, leaving the seat empty", async () => {
    players = [
      player({ id: "host", session_id: "s-host", user_id: "u-host", username: "host" }),
      player({ id: "guest", session_id: "s-guest", user_id: null }),
    ];
    games = [
      game({
        id: "g-invite",
        room_code: "INVIT",
        status: "waiting",
        player1_id: "host",
        player2_id: null,
      }),
    ];

    const { joinGame } = await import("./service.server");
    await expect(joinGame(callerFor(players[1]), "INVIT")).rejects.toThrow("Sign in to play.");
    expect(games[0].player2_id).toBeNull();
  });

  it("rejects a signed-in account that has not picked a username yet", async () => {
    players = [
      player({ id: "host", session_id: "s-host", user_id: "u-host", username: "host" }),
      player({ id: "fresh", session_id: "s-fresh", user_id: "u-fresh", username: null }),
    ];
    games = [
      game({
        id: "g-invite",
        room_code: "INVIT",
        status: "waiting",
        player1_id: "host",
        player2_id: null,
      }),
    ];

    const { joinGame } = await import("./service.server");
    await expect(joinGame(callerFor(players[1]), "INVIT")).rejects.toThrow(
      "Pick a username before playing.",
    );
    expect(games[0].player2_id).toBeNull();
  });

  it("seats a named account", async () => {
    players = [
      player({ id: "host", session_id: "s-host", user_id: "u-host", username: "host" }),
      player({ id: "named", session_id: "s-named", user_id: "u-named", username: "named" }),
    ];
    games = [
      game({
        id: "g-invite",
        room_code: "INVIT",
        status: "waiting",
        player1_id: "host",
        player2_id: null,
      }),
    ];

    const { joinGame } = await import("./service.server");
    await expect(joinGame(callerFor(players[1]), "INVIT")).resolves.toEqual({ roomCode: "INVIT" });
    expect(games[0].player2_id).toBe("named");
  });

  it("rejects a guest creating a lobby", async () => {
    players = [player({ id: "guest", session_id: "s-guest", user_id: null })];
    games = [];

    const { createGame } = await import("./service.server");
    await expect(createGame(callerFor(players[0]))).rejects.toThrow("Sign in to play.");
    expect(games).toHaveLength(0);
  });
});
