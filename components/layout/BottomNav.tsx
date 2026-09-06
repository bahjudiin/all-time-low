"use client";

import {
  Trophy,
  Zap,
  BarChart3,
  Activity,
  Settings,
} from "lucide-react";
import { useNavStore } from "@/lib/navStore";
import { NAV_ITEMS, type NavTabId } from "@/types/nav";

const ICONS: Record<NavTabId, typeof Trophy> = {
  "ath-atl": Trophy,
  "pump-dump": Zap,
  "over-under": BarChart3,
  liquidations: Activity,
  settings: Settings,
};

export function BottomNav() {
  const activeNavTab = useNavStore((s) => s.activeNavTab);
  const setActiveNavTab = useNavStore((s) => s.setActiveNavTab);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md safe-bottom">
      <div className="flex items-stretch max-w-3xl mx-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.id];
          const active = activeNavTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveNavTab(item.id)}
              aria-current={active ? "page" : undefined}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-1 transition-colors ${
                active
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}