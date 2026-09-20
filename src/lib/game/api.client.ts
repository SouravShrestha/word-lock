/**
 * Client-side API wrappers for interacting with Next.js Route Handlers.
 * These replace the previous TanStack Server Functions.
 */
import { browserTimezone } from "@/lib/account/timezone";
import type { LeaderboardView } from "@/hooks/use-leaderboard";

async function post(path: string, data: any): Promise<any> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as any;
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

/**
 * Calls a game endpoint, attaching the browser's timezone.
 *
 * Added here rather than at each call site so every action carries it: the
 * server needs a timezone to decide where the player's local day ends for
 * streak purposes, and it is the same answer for every request.
 */
async function fetcher(endpoint: string, data: any): Promise<any> {
  return post(`/api/game/${endpoint}`, { timezone: browserTimezone(), ...data });
}

/**
 * Attaches the account link to a sign-in, absorbing this browser's guest games.
 *
 * The auth session travels as a cookie, so nothing about the account is passed
 * in the body — only the guest session id, which the server cannot see.
 */
export async function claimAccountFn(data: { sessionId: string }) {
  return post("/api/account/claim", data);
}

export async function fetchAccountFn(data: { sessionId: string; timezone?: string }) {
  return post("/api/account/summary", data);
}

export async function setUsernameFn(data: { sessionId: string; username: string }) {
  return post("/api/account/username", data);
}

export async function setAvatarFn(data: { sessionId: string; avatar: string }) {
  return post("/api/account/avatar", data);
}

export async function fetchLeaderboardFn(): Promise<LeaderboardView> {
  const response = await fetch("/api/account/leaderboard");
  if (!response.ok) throw new Error(`HTTP error ${response.status}`);
  return response.json();
}

/** Availability check for the username picker. Advisory only. */
export async function checkUsernameFn(
  username: string,
): Promise<{ available: boolean; reason?: string }> {
  const response = await fetch(`/api/account/username/check?u=${encodeURIComponent(username)}`);
  if (!response.ok) throw new Error(`HTTP error ${response.status}`);
  return response.json();
}

export async function fetchLobby(data: { sessionId: string }) {
  return fetcher("lobby", data);
}

export async function createGameFn(data: { sessionId: string }) {
  return fetcher("create", data);
}

export async function joinGameFn(data: { sessionId: string; roomCode: string }) {
  return fetcher("join", data);
}

export async function fetchGameFn(data: { sessionId?: string; roomCode: string }) {
  return fetcher("fetch", data);
}

export async function submitMoveFn(data: {
  sessionId: string;
  roomCode: string;
  word: string;
  tileIndices: number[];
}) {
  return fetcher("move", data);
}

export async function passTurnFn(data: { sessionId: string; roomCode: string }) {
  return fetcher("pass", data);
}

export async function startGameFn(data: { sessionId: string; roomCode: string }) {
  return fetcher("start", data);
}

export async function destroyGameFn(data: { sessionId: string; roomCode: string }) {
  return fetcher("destroy", data);
}

export async function forfeitGameFn(data: { sessionId: string; roomCode: string }) {
  return fetcher("forfeit", data);
}

export async function timeoutGameFn(data: { sessionId: string; roomCode: string }) {
  return fetcher("timeout", data);
}

export async function leaveLobbyFn(data: { sessionId: string; roomCode: string }) {
  return fetcher("leave", data);
}

export async function sendReactionFn(data: { sessionId: string; roomCode: string; emoji: string }) {
  return fetcher("reaction", data);
}

export async function fetchProfileFn(data: { sessionId: string }) {
  return fetcher("profile", data);
}
