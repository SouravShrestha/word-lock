import { get, post } from "./transport";
import type { AccountSummary, LeaderboardView, UsernameAvailability } from "./types";

export async function claimAccountFn(data: { sessionId: string }) {
  return post("/api/account/claim", data);
}

export async function fetchAccountFn(data: {
  sessionId: string;
  timezone?: string;
}): Promise<AccountSummary> {
  return post("/api/account/summary", data);
}

export async function setUsernameFn(data: { sessionId: string; username: string }) {
  return post("/api/account/username", data);
}

export async function setAvatarFn(data: { sessionId: string; avatar: string }) {
  return post("/api/account/avatar", data);
}

export async function deleteAccountFn(data: { sessionId: string }) {
  return post("/api/account/delete", data);
}

export async function fetchLeaderboardFn(): Promise<LeaderboardView> {
  return get("/api/account/leaderboard");
}

export async function checkUsernameFn(username: string): Promise<UsernameAvailability> {
  return get(`/api/account/username/check?u=${encodeURIComponent(username)}`);
}
