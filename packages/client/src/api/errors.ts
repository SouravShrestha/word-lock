/**
 * An API error that carries the response's HTTP status.
 *
 * Plain `Error` gave TanStack Query nothing to decide a retry on, so a
 * deliberate 4xx from the server (a validation failure, "it's not your turn
 * yet") got retried exactly like a transient 5xx would. `shouldRetry` reads
 * `status` off this to tell the two apart.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
