export interface AccountSummary {
  playerId: string;
  username: string | null;
  usernameLocked: boolean;
  avatar: string;
  joinedAt: string;
  stars: number;
  peakStars: number;
  starGames: number;
  playStreak: number;
  bestPlayStreak: number;
  lastPlayedOn: string | null;
  lastFreezeOn: string | null;
}

export interface UsernameAvailability {
  available: boolean;
  reason?: string;
}
