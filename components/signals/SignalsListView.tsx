"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
import type { CoinMarket, CoinWithDerived } from "@/types/coin";
import type { CoinSignals, SignalDirection } from "@/types/signal";
import { computeDerived } from "@/lib/coingecko";
import { useNavStore } from "@/lib/navStore";
import { SignalCardDetailed } from "@/components/signals/SignalCardDetailed";
import { isStable, isLowVolatility, hasNoMovement } from "@/lib/filters";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function SignalsListView() {
  const openModal = useNavStore((s) => s.openModal);
  const [dir, setDir] = useState<"all" | SignalDirection>("all");

  const { data: signalCoins, isLoading } = useSWR<(CoinMarket & { signals?: CoinSignals })[]>(
    "/api/signals?currency=usd",
    fetcher,
    { refreshInterval: 300_000, revalidateOnFocus: false, dedupingInterval: 120_000 }
  );

  const filtered = useMemo(() => {
    if (!signalCoins) return [];
    let result = signalCoins
      .map((c) => ({ ...c, ...computeDerived(c) }))
      .filter((c) => c.signals && !isStable(c as never) && !isLowVolatility(c as never) && !hasNoMovement(c as never));
    if (dir !== "all") result = result.filter((c) => c.signals?.direction === dir);
    return result.sort((a, b) => Math.abs(b.signals?.score ?? 0) - Math.abs(a.signals?.score ?? 0));
  }, [signalCoins, dir]);

  const summary = useMemo(() => {
    if (!signalCoins) return { strongLong: 0, long: 0, wait: 0, short: 0, strongShort: 0 };
    const withSignals = signalCoins.filter((c) => c.signals);
    return {
      strongLong: withSignals.filter((c) => c.signals?.direction === "strong_long").length,
      long: withSignals.filter((c) => c.signals?.direction === "long" || c.signals?.direction === "lean_long").length,
      wait: withSignals.filter((c) => c.signals?.direction === "wait").length,
      short: withSignals.filter((c) => c.signals?.direction === "short" || c.signals?.direction === "lean_short").length,
      strongShort: withSignals.filter((c) => c.signals?.direction === "strong_short").length,
    };
  }, [signalCoins]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 md:px-6 py-2 border-b border-zinc-200 dark:border-zinc-800 text-[11px]">
        <div className="flex items-center gap-3">
          <span className="text-emerald-400 font-semibold">{summary.strongLong} SL</span>
          <span className="text-emerald-300">{summary.long} L</span>
          <span className="text-zinc-500">{summary.wait} W</span>
          <span className="text-red-300">{summary.short} S</span>
          <span className="text-red-400 font-semibold">{summary.strongShort} SS</span>
        </div>
        <div className="flex items-center gap-1">
          {(["all", "strong_long", "long", "short", "strong_short"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDir(d)}
              className={`px-2 py-1 text-[10px] rounded transition-colors ${
                dir === d ? "bg-blue-600 text-white" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {d === "all" ? "All" : d === "strong_long" ? "SL" : d === "long" ? "L" : d === "short" ? "S" : "SS"}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-3 md:p-4">
        {isLoading && (
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-zinc-500">Computing signals...</p>
          </div>
        )}
        {!isLoading && filtered.length === 0 && <p className="text-xs text-zinc-500 text-center py-16">No signals available</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((coin) => (
            <div key={coin.id} onClick={() => openModal(coin.id)} className="cursor-pointer">
              <SignalCardDetailed coin={coin as CoinWithDerived} signals={coin.signals!} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}