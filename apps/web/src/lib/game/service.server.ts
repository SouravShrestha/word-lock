/**
 * Re-export barrel. The game service used to be one 700-line file; it is now
 * split by concern (read/lifecycle/moves/sweep/stats) so each file stays
 * readable and independently testable. This barrel keeps every existing
 * `@/lib/game/service.server` import working unchanged.
 */
export * from "./read.server";
export * from "./lifecycle.server";
export * from "./moves.server";
export * from "./sweep.server";
export * from "./stats.server";
