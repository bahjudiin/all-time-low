"use client";

import { useMemo } from "react";
import type { CoinWithDerived } from "@/types/coin";
import { formatUSD, formatPercentValue, formatCompact } from "@/lib/format";
import { isStable, isExtreme } from "@/lib/filters";
import { Sparkline } from "./Sparkline";

interface MarketGlanceProps {
  coins: CoinWithDerived[];
}

export function MarketGlance({ coins }: MarketGlanceProps) {
  const stats = useMemo(() => {
    const movers = coins.filter((c) => !isStable(c));
    const top = [...movers].sort((a, b) => b.market_cap - a.market_cap).slice(0, 5);
    const gainers = [...movers].sort(
      (a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h
    );
    const losers = [...movers].sort(
      (a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h
    );
    const nearAth = movers.filter((c) => isExtreme(c) && c.ath_change_percentage >= -5);
    const totalMcap = movers.reduce((s, c) => s + (c.market_cap || 0), 0);
    const totalVolume = movers.reduce((s, c) => s + (c.total_volume || 0), 0);
    const avg24h = movers.length
      ? movers.reduce((s, c) => s + c.price_change_percentage_24h, 0) / movers.length
      : 0;

    return {
      top,
      gainers: gainers.slice(0, 5),
      losers: losers.slice(0, 5),
      nearAthCount: nearAth.length,
      totalMcap,
      totalVolume,
      avg24h,
      coinCount: movers.length,
    };
  }, [coins]);

  const statCards = [
    { label: "Coins Tracked", value: stats.coinCount.toLocaleString(), accent: "" },
    { label: "Total Market Cap", value: `$${formatCompact(stats.totalMcap)}`, accent: "" },
    { label: "24h Volume", value: `$${formatCompact(stats.totalVolume)}`, accent: "" },
    { label: "Avg 24h Change", value: formatPercentValue(stats.avg24h), accent: stats.avg24h >= 0 ? "text-green-500" : "text-red-500" },
    { label: "Near ATH (<5%)", value: stats.nearAthCount.toString(), accent: "text-blue-500" },
  ];

  return (
    <div className="flex-1 overflow-auto p-5 space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4"
          >
            <div className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              {card.label}
            </div>
            <div className={`text-xl font-semibold mt-1 ${card.accent}`}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Leading coins with sparklines */}
      <section>
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
          Leading Coins
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {stats.top.map((coin) => (
            <div
              key={coin.id}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 hover:border-blue-500/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full" loading="lazy" />
                <span className="font-medium text-sm truncate">{coin.name}</span>
              </div>
              <div className="text-lg font-semibold">{formatUSD(coin.current_price)}</div>
              <div
                className={`text-xs font-medium ${
                  coin.price_change_percentage_24h >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {formatPercentValue(coin.price_change_percentage_24h)} (24h)
              </div>
              <div className="mt-3 -mx-3">
                <Sparkline data={coin.sparkline_in_7d?.price ?? []} width={100} height={28} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Gainers vs Losers */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-medium text-green-600 dark:text-green-400 mb-3">
            Top Gainers (24h)
          </h2>
          <div className="space-y-1">
            {stats.gainers.map((coin, i) => (
              <div
                key={coin.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-zinc-400 w-4">{i + 1}</span>
                  <img src={coin.image} alt="" className="w-5 h-5 rounded-full" loading="lazy" />
                  <span className="text-sm truncate">{coin.name}</span>
                  <span className="text-xs text-zinc-400 uppercase">{coin.symbol}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {formatUSD(coin.current_price)}
                  </span>
                  <span className="text-sm font-medium text-green-500 w-16 text-right">
                    {formatPercentValue(coin.price_change_percentage_24h)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-sm font-medium text-red-500 mb-3">Top Losers (24h)</h2>
          <div className="space-y-1">
            {stats.losers.map((coin, i) => (
              <div
                key={coin.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-zinc-400 w-4">{i + 1}</span>
                  <img src={coin.image} alt="" className="w-5 h-5 rounded-full" loading="lazy" />
                  <span className="text-sm truncate">{coin.name}</span>
                  <span className="text-xs text-zinc-400 uppercase">{coin.symbol}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {formatUSD(coin.current_price)}
                  </span>
                  <span className="text-sm font-medium text-red-500 w-16 text-right">
                    {formatPercentValue(coin.price_change_percentage_24h)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
