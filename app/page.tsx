import type { Metadata } from "next";
import Link from "next/link";
import { fetchCoinsMarkets } from "@/lib/coingecko";
import { ScreenerClient } from "@/components/screener/ScreenerClient";
import { ThemeToggle } from "@/components/screener/ThemeToggle";

export const metadata: Metadata = {
  title: "ATH/ATL Tracker",
  description: "Real-time crypto ATH/ATL tracker with predictive signals",
};

export const revalidate = 60;

export default async function Home() {
  let coins: Awaited<ReturnType<typeof fetchCoinsMarkets>> = [];
  try {
    coins = await fetchCoinsMarkets("usd", 250, 1);
  } catch (e) {
    console.error("Failed to fetch coins:", e);
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-4 md:gap-6">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">A</span>
            </div>
            <span className="text-sm font-semibold hidden sm:inline">ATH/ATL</span>
          </Link>
          <nav className="flex items-center gap-0.5">
            <Link href="/" className="px-2.5 py-1 text-xs font-medium rounded-md bg-blue-600 text-white whitespace-nowrap">
              Screener
            </Link>
            <Link href="/prediction" className="px-2.5 py-1 text-xs font-medium rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap">
              Pre-Reversal
            </Link>
          </nav>
        </div>
        <ThemeToggle />
      </header>
      <ScreenerClient initialCoins={coins} />
    </div>
  );
}
