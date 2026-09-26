export interface ViewerCandidate {
  id: string;
  session_id: string;
  user_id?: string | null;
}

export interface ViewerCaller {
  sessionId?: string;
  userId: string | null;
}

export function findViewerId(players: ViewerCandidate[], caller: ViewerCaller): string | null {
  if (caller.userId) {
    return players.find((p) => p.user_id === caller.userId)?.id ?? null;
  }
  if (!caller.sessionId) return null;
  return players.find((p) => p.session_id === caller.sessionId)?.id ?? null;
}
