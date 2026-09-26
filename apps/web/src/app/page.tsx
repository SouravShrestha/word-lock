import type { Metadata } from "next";
import { LobbyClient } from "./_components/LobbyClient";

export const metadata: Metadata = {
  title: "Word lock - Word Territory Game",
  description:
    "Word lock is an invite-only two player word game. Claim tiles from a 5x5 letter grid, surround your rival's letters to lock them, and take the board.",
  openGraph: {
    title: "Word lock - Word Territory Game",
    description: "Claim letters, lock tiles, win the grid. Invite a friend with a room code.",
  },
};

export default function LobbyPage() {
  return <LobbyClient />;
}
