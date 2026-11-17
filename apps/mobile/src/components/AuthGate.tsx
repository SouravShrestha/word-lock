import { useAccount, useAuth } from "@word-lock/client";
import { isPublicRoute } from "@word-lock/core/auth";
import { usePathname } from "expo-router";
import { useState } from "react";

import { AuthSheet } from "@/components/AuthSheet";
import { UsernameSheet } from "@/components/UsernameSheet";

export function AuthGate() {
  const pathname = usePathname();
  const { isLoginRequired, isLoggedIn, ready: authReady } = useAuth();
  const { data: account, isLoading: accountLoading } = useAccount();
  // Set by AuthSheet while a code is checked and its "Verified" capsule plays.
  const [holdLogin, setHoldLogin] = useState(false);

  const needsUsername = authReady && isLoggedIn && !accountLoading && account?.username === null;

  if (isPublicRoute(pathname)) return null;
  if (isLoginRequired || holdLogin) return <AuthSheet onHold={setHoldLogin} />;
  if (needsUsername) return <UsernameSheet />;
  return null;
}
