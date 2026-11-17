"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { AuthSheet } from "@/components/AuthSheet";
import { UsernameSheet } from "@/components/UsernameSheet";
import { useAuth } from "@word-lock/client";
import { isPublicRoute } from "@word-lock/core/auth";

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { ready } = useAuth();
  if (isPublicRoute(pathname)) return <>{children}</>;

  // The screen waits for the session check, so a logged-out visitor never sees it flash before the sheet.
  return (
    <>
      {ready && children}
      <AuthSheet />
      <UsernameSheet />
    </>
  );
}
