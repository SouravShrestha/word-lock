import type { Metadata } from "next";
import { LeaderboardClient } from "./_components/LeaderboardClient";

export const metadata: Metadata = {
  title: "Leaderboard - Word lock",
  description: "See how you rank against the rest of your league.",
};

export default function LeaderboardPage() {
  return <LeaderboardClient />;
}
