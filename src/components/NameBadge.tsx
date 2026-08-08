import Link from "next/link";
import { AvatarPandaIcon } from "@/components/icons/AvatarPandaIcon";

export function NameBadge({ value }: { value: string }) {
  return (
    <Link
      href="/profile"
      title="View your profile"
      className="chunky-btn flex items-center gap-2 bg-card px-4 py-1.5 text-sm text-foreground"
    >
      <AvatarPandaIcon className="w-5 h-5 text-foreground" />
      <span>{value || "Add your name"}</span>
    </Link>
  );
}
