import { PredictionClient } from "@/components/prediction/PredictionClient";
import Link from "next/link";

export const metadata = {
  title: "Pre-Reversal Prediction — ATH/ATL Tracker",
  description: "Predictive exhaustion zone analysis for crypto markets.",
};

export default function PredictionPage() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <h1 className="text-lg font-semibold">ATH/ATL Tracker</h1>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/"
              className="px-3 py-1.5 text-sm font-medium rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Screener
            </Link>
            <Link
              href="/prediction"
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white"
            >
              Pre-Reversal
            </Link>
          </nav>
        </div>
      </header>
      <PredictionClient />
    </div>
  );
}
