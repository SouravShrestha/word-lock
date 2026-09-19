import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Rubik } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";

import { QueryProvider } from "@/components/QueryProvider";
import { TopLoader } from "@/components/TopLoader";
import { SessionProvider } from "@/components/SessionProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { AuthSheet } from "@/components/AuthSheet";
import { UsernameSheet } from "@/components/UsernameSheet";
import { AuthErrorNotice } from "@/components/AuthErrorNotice";
import "./globals.css";

// Rubik is a variable font on Google Fonts, so no explicit weight list is
// needed.
const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1b2026" },
  ],
};

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "Word lock - Word Territory Game",
  description:
    "Word lock: a two-player word territory game. Claim letters from a shared 5x5 grid and lock down the board.",
  openGraph: {
    title: "Word lock",
    description: "Claim letters, lock tiles, win the grid.",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: "Word lock",
    description:
      "Word lock: a two-player word territory game. Claim letters from a shared 5x5 grid and lock down the board.",
    playMode: "MultiPlayer",
    genre: ["Word Game", "Puzzle"],
    applicationCategory: "GameApplication",
    url: baseUrl,
  };

  return (
    <html lang="en" suppressHydrationWarning className={rubik.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning>
        <TopLoader />
        <QueryProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <SessionProvider>
              <AuthProvider>
                {children}
                <AuthSheet />
                <UsernameSheet />
                {/* Reads search params, so it needs a Suspense boundary. */}
                <Suspense fallback={null}>
                  <AuthErrorNotice />
                </Suspense>
              </AuthProvider>
            </SessionProvider>
            <Toaster position="top-center" richColors />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
