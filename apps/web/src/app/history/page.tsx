import type { Metadata } from "next";
import { HistoryClient } from "./_components/HistoryClient";

export const metadata: Metadata = {
  title: "History - Word lock",
  description: "Every Word lock game you have finished, newest first.",
};

export default function HistoryPage() {
  return <HistoryClient />;
}
