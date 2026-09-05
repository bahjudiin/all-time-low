"use client";

import type { CoinWithDerived } from "@/types/coin";

interface MarketGlanceProps {
  coins: CoinWithDerived[];
}

export function MarketGlance({ coins }: MarketGlanceProps) {
  if (coins.length === 0) return null;

  const totalMarketCap = coins.reduce((s, c) => s + c.market_cap, 0);
  const totalVolume = coins.reduce((s, c) => s + c.total_volume, 0);
  const avgChange24h = coins.reduce((s, c) => s + c.price_change_percentage_24h, 0) / coins.length;

  const nearATH = coins.filter((c) => c.ath_change_percentage >= -15 && c.ath_change_percentage < 0).length;
  const nearATL = coins.filter((c) => c.atl_change_percentage <= 15 && c.atl_change_percentage > 0).length;
  const aboveATH = coins.filter((c) => c.ath_change_percentage >= 0).length;
  const deepRed = coins.filter((c) => c.ath_change_percentage <= -80).length;
  const strongPump = coins.filter((c) => c.price_change_percentage_24h > 10).length;
  const strongDump = coins.filter((c) => c.price_change_percentage_24h < -10).length;

  const avgATHDistance = coins.reduce((s, c) => s + c.ath_change_percentage, 0) / coins.length;
  const avgATLDistance = coins.reduce((s, c) => s + c.atl_change_percentage, 0) / coins.length;

  const biggestGainer = [...coins].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)[0];
  const biggestLoser = [...coins].sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h)[0];

  const formatCompact = (n: number) => {
    if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    return `$${n.toLocaleString()}`;
  };

  return (
    <div className="px-3 md:px-6 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
      <div className="scroll-x">
        <div className="flex items-center gap-4 md:gap-6 min-w-max text-[11px] md:text-xs">
          {/* Market Overview */}
          <div className="flex items-center gap-3">
            <div>
              <span className="text-zinc-500">MCap </span>
              <span className="font-mono font-medium text-foreground">{formatCompact(totalMarketCap)}</span>
            </div>
            <div>
              <span className="text-zinc-500">Vol </span>
              <span className="font-mono font-medium text-foreground">{formatCompact(totalVolume)}</span>
            </div>
            <div>
              <span className="text-zinc-500">Avg </span>
              <span className={`font-mono font-medium ${avgChange24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                {avgChange24h >= 0 ? "+" : ""}{avgChange24h.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="w-px h-3.5 bg-zinc-300 dark:bg-zinc-700" />

          {/* ATH/ATL Stats */}
          <div className="flex items-center gap-3">
            <div>
              <span className="text-zinc-500">ATH </span>
              <span className="font-mono text-amber-400">{avgATHDistance.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-zinc-500">ATL </span>
              <span className="font-mono text-green-400">+{avgATLDistance.toFixed(1)}%</span>
            </div>
            <span className="text-green-400">{aboveATH} ATH</span>
            <span className="text-amber-400">{nearATH} near</span>
            <span className="text-blue-400">{nearATL} ATL</span>
            <span className="text-red-400">{deepRed} -80%+</span>
          </div>

          <div className="w-px h-3.5 bg-zinc-300 dark:bg-zinc-700" />

          {/* 24h Action */}
          <div className="flex items-center gap-3">
            <span className="text-green-400">{strongPump} pump</span>
            <span className="text-red-400">{strongDump} dump</span>
            {biggestGainer && (
              <span className="text-green-400">Top: {biggestGainer.symbol.toUpperCase()} +{biggestGainer.price_change_percentage_24h.toFixed(1)}%</span>
            )}
            {biggestLoser && (
              <span className="text-red-400">Bot: {biggestLoser.symbol.toUpperCase()} {biggestLoser.price_change_percentage_24h.toFixed(1)}%</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
