/**
 * Client-side API wrappers for interacting with Next.js Route Handlers.
 * These replace the previous TanStack Server Functions.
 */

async function fetcher(endpoint: string, data: any): Promise<any> {
  const response = await fetch(`/api/game/${endpoint}`, {
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

export async function fetchLobby(data: { sessionId: string; displayName?: string }) {
  return fetcher("lobby", data);
}

export async function createGameFn(data: { sessionId: string; displayName?: string }) {
  return fetcher("create", data);
}

export async function joinGameFn(data: {
  sessionId: string;
  displayName?: string;
  roomCode: string;
}) {
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

export async function fetchProfileFn(data: { sessionId: string }) {
  return fetcher("profile", data);
}
