"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "@/components/icons";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const toggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mounted && theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="chunky-btn grid h-10 w-10 place-items-center bg-card text-foreground"
    >
      {mounted && theme === "dark" ? (
        <Sun className="h-5 w-5" aria-hidden />
      ) : (
        <Moon className="h-5 w-5" aria-hidden />
      )}
    </button>
  );
}
