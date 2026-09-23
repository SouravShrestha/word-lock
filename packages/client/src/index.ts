export {
  ApiError,
  configureApiClient,
  getApiConfig,
  type ApiConfig,
  claimAccountFn,
  checkUsernameFn,
  deleteAccountFn,
  fetchAccountFn,
  fetchLeaderboardFn,
  setAvatarFn,
  setUsernameFn,
  createGameFn,
  destroyGameFn,
  fetchGameFn,
  fetchLobby,
  fetchProfileFn,
  forfeitGameFn,
  joinGameFn,
  leaveLobbyFn,
  passTurnFn,
  sendReactionFn,
  startGameFn,
  submitMoveFn,
  timeoutGameFn,
  type AccountSummary,
  type LeaderboardEntry,
  type LeaderboardStanding,
  type LeaderboardView,
  type UsernameAvailability,
} from "./api/index";

export { ClientPlatformContext, useClientPlatform } from "./platform";
export type { ClientPlatform, ClientStorage } from "./platform";

export { SESSION_KEY, SessionContext, useSession, useSessionState } from "./session/use-session";
export type { SessionContextValue } from "./session/use-session";

export { AuthContext, useAuth, useAuthState } from "./auth/use-auth";
export { useClaimGuest } from "./auth/use-claim-guest";
export type { AuthAdapter, AuthContextValue, EmailSignInOutcome } from "./auth/adapter";

export { QUERY_DEFAULTS, shouldRetry } from "./queries/retry";
export { useAccount } from "./queries/use-account";
export { useLeaderboard } from "./queries/use-leaderboard";

export { useMoveReview } from "./game/use-move-review";
export type { MoveReview } from "./game/use-move-review";

export { AuthProvider, ClientPlatformProvider, QueryProvider, SessionProvider } from "./providers";
