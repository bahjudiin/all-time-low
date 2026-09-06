"use client";

import { ThemeToggle } from "@/components/screener/ThemeToggle";

export function TopBar() {
  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-background">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-white font-bold text-xs">A</span>
        </div>
        <span className="text-sm font-semibold">ATH/ATL</span>
      </div>
      <ThemeToggle />
    </header>
  );
}