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
    <div className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
      <div className="flex items-center gap-6 overflow-x-auto text-xs">
        {/* Market Overview */}
        <div className="flex items-center gap-4">
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

        <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700" />

        {/* ATH/ATL Stats */}
        <div className="flex items-center gap-4">
          <div>
            <span className="text-zinc-500">ATH dist </span>
            <span className="font-mono text-amber-400">{avgATHDistance.toFixed(1)}%</span>
          </div>
          <div>
            <span className="text-zinc-500">ATL dist </span>
            <span className="font-mono text-green-400">+{avgATLDistance.toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-green-400 font-medium">{aboveATH} above ATH</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-amber-400">{nearATH} near ATH</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-blue-400">{nearATL} near ATL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-red-400">{deepRed} deep red (-80%+)</span>
          </div>
        </div>

        <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700" />

        {/* 24h Action */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-green-400 font-medium">{strongPump} pump 10%+</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-red-400 font-medium">{strongDump} dump 10%+</span>
          </div>
          {biggestGainer && (
            <div>
              <span className="text-zinc-500">Top: </span>
              <span className="text-green-400 font-medium">{biggestGainer.symbol.toUpperCase()} +{biggestGainer.price_change_percentage_24h.toFixed(1)}%</span>
            </div>
          )}
          {biggestLoser && (
            <div>
              <span className="text-zinc-500">Bot: </span>
              <span className="text-red-400 font-medium">{biggestLoser.symbol.toUpperCase()} {biggestLoser.price_change_percentage_24h.toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
