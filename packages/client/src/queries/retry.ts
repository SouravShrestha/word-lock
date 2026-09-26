import { ApiError } from "../api/errors";

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status < 500) return false;
  return failureCount < 2;
}

export const QUERY_DEFAULTS = {
  staleTime: 10_000,
  retry: shouldRetry,
} as const;
