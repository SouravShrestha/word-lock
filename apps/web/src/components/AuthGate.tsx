"use client";

import { usePathname } from "next/navigation";

import { AuthSheet } from "@/components/AuthSheet";
import { UsernameSheet } from "@/components/UsernameSheet";
import { isPublicRoute } from "@word-lock/core/auth";

export function AuthGate() {
  const pathname = usePathname();
  if (isPublicRoute(pathname)) return null;

  return (
    <>
      <AuthSheet />
      <UsernameSheet />
    </>
  );
}
