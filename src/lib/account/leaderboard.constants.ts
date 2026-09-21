/**
 * Leaderboard tuning shared by the server query and the UI copy.
 *
 * Separate from `leaderboard.server.ts` so client components can state the rules
 * without importing the module that pulls in the service-role Supabase client.
 */

/** How many rows the board shows. */
export const LEADERBOARD_SIZE = 20;
