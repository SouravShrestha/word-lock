import { browserTimezone } from "@word-lock/core/account";

import { post } from "./transport";

async function fetcher(endpoint: string, data: Record<string, unknown>): Promise<any> {
  return post(`/api/game/${endpoint}`, { timezone: browserTimezone(), ...data });
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
