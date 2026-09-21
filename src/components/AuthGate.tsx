"use client";

import { usePathname } from "next/navigation";

import { AuthSheet } from "@/components/AuthSheet";
import { UsernameSheet } from "@/components/UsernameSheet";
import { isPublicRoute } from "@/lib/auth/public-routes";

/**
 * The login wall, mounted once in the root layout.
 *
 * Both sheets decide for themselves whether they are open — this component only
 * decides whether they exist at all. On a public route (see
 * `lib/auth/public-routes.ts`) they are not rendered, so a legal page can be
 * read, linked and crawled by someone who has no account and is not going to
 * make one. Everywhere else the wall is unchanged: logged out means the login
 * sheet owns the screen.
 *
 * This is the only place that exception lives. Nothing else should ask whether
 * the current screen needs an account.
 */
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
