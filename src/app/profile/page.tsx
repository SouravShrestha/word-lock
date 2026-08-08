import type { Metadata } from "next";
import { ProfileClient } from "./_components/ProfileClient";

export const metadata: Metadata = {
  title: "Profile - Word lock",
  description: "View your win/loss record, game history, and head-to-head stats.",
};

export default function ProfilePage() {
  return <ProfileClient />;
}
