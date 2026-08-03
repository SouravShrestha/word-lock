import type { Metadata } from "next";
import { GameClient } from "./_components/GameClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `Room ${resolvedParams.code} - Word lock`,
    description: `Join Word lock room ${resolvedParams.code}. Two players, one 5x5 letter grid - claim tiles, lock them in, take the board.`,
    openGraph: {
      title: `Join my Word lock game - room ${resolvedParams.code}`,
      description: "Two players, one 5x5 letter grid. Claim tiles, lock them in, take the board.",
    },
  };
}

export default async function GamePage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = await params;
  return <GameClient code={resolvedParams.code.toUpperCase()} />;
}
