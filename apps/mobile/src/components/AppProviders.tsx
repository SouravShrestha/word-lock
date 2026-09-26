import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import {
  AuthProvider as SharedAuthProvider,
  ClientPlatformProvider,
  configureApiClient,
  QueryProvider as SharedQueryProvider,
  SessionProvider as SharedSessionProvider,
} from "@word-lock/client";
import type { ReactNode } from "react";

import { AuthGate } from "@/components/AuthGate";
import { TopLoader } from "@/components/TopLoader";
import { ToastHost } from "@/components/Toast";
import { nativeAuthAdapter } from "@/lib/auth-adapter";
import { nativePlatform } from "@/lib/client-platform";
import { supabase } from "@/lib/supabase";
import { ThemeProvider } from "@/theme/ThemeProvider";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
if (!API_URL) {
  throw new Error("Missing environment variable: EXPO_PUBLIC_API_URL");
}

configureApiClient({
  baseUrl: API_URL,
  getAuthHeaders: async (): Promise<Record<string, string>> => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return {};
    return { Authorization: `Bearer ${data.session.access_token}` };
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ClientPlatformProvider platform={nativePlatform}>
      <ThemeProvider>
        <SharedSessionProvider>
          <SharedQueryProvider>
            <SharedAuthProvider adapter={nativeAuthAdapter}>
              <BottomSheetModalProvider>{children}</BottomSheetModalProvider>
              <AuthGate />
              <ToastHost />
              <TopLoader />
            </SharedAuthProvider>
          </SharedQueryProvider>
        </SharedSessionProvider>
      </ThemeProvider>
    </ClientPlatformProvider>
  );
}
