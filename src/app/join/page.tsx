import type { Metadata } from "next";
import { JoinClient } from "./_components/JoinClient";

export const metadata: Metadata = {
  title: "Join Game - Word lock",
  description: "Join an existing Word lock game with a room code.",
};

export default function JoinPage() {
  return <JoinClient />;
}
