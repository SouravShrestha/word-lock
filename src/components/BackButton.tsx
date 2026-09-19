"use client";

import { useRouter } from "next/navigation";
import { LeftArrowIcon } from "@/components/icons/LeftArrowIcon";
import { cn } from "@/lib/utils";

export function BackButton({
  onClick,
  className,
  label = "Back",
}: {
  onClick?: () => void;
  className?: string;
  label?: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={onClick ?? (() => router.push("/"))}
      aria-label={label}
      className={cn("soft-icon-btn btn-sun h-9 w-9", className)}
    >
      <LeftArrowIcon className="h-4 w-4" />
    </button>
  );
}
