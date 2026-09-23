import { useAccount, useAuth } from "@word-lock/client";
import { isPublicRoute } from "@word-lock/core/auth";
import { usePathname } from "expo-router";

import { AuthSheet } from "@/components/AuthSheet";
import { UsernameSheet } from "@/components/UsernameSheet";

export function AuthGate() {
  const pathname = usePathname();
  const { isLoginRequired, isLoggedIn, ready: authReady } = useAuth();
  const { data: account, isLoading: accountLoading } = useAccount();

  const needsUsername = authReady && isLoggedIn && !accountLoading && account?.username === null;

  if (isPublicRoute(pathname)) return null;
  if (needsUsername) return <UsernameSheet />;
  if (isLoginRequired) return <AuthSheet />;
  return null;
}
