"use client";

import { useEffect } from "react";
import { Moon, Sun } from "lucide-react";

function toggleAndPersist() {
  const root = document.documentElement;
  const dark = root.classList.toggle("dark");
  try {
    localStorage.setItem("theme", dark ? "dark" : "light");
  } catch {
    // storage unavailable (private mode)
  }
}

export function ThemeToggle() {
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (!stored) {
      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      localStorage.setItem("theme", dark ? "dark" : "light");
    }
  }, []);

  return (
    <button
      onClick={toggleAndPersist}
      className="p-2 rounded-lg hover:bg-surface-hover dark:hover:bg-surface-hover transition-colors"
      aria-label="Toggle theme"
    >
      <Sun className="w-4 h-4 text-text-tertiary dark:hidden" />
      <Moon className="w-4 h-4 text-text-secondary hidden dark:block" />
    </button>
  );
}