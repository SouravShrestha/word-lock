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
      className="soft-icon-btn btn-surface h-9 w-9"
    >
      {mounted && theme === "dark" ? (
        <Sun className="h-[1.1rem] w-[1.1rem]" aria-hidden />
      ) : (
        <Moon className="h-[1.1rem] w-[1.1rem]" aria-hidden />
      )}
    </button>
  );
}
