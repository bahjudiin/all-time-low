"use client";

import type { CoinWithDerived } from "@/types/coin";
import type { CoinSignals } from "@/types/signal";
import { SignalBadge } from "./SignalBadge";
import { GroupStatus } from "./GroupStatus";

interface SignalCardDetailedProps {
  coin: CoinWithDerived;
  signals: CoinSignals;
}

export function SignalCardDetailed({ coin, signals }: SignalCardDetailedProps) {
  const groups = [
    signals.momentum,
    signals.trend,
    signals.marketStructure,
    signals.crowdSentiment,
    signals.volumeFlow,
    signals.confirmation,
    signals.athAtlPosition,
  ];

  const leftGroups = groups.slice(0, 4);
  const rightGroups = groups.slice(4);

  const agreedCount = groups.filter((g) => g.agreed).length;
  const longGroups = groups.filter((g) => g.signal === 1).length;
  const shortGroups = groups.filter((g) => g.signal === -1).length;
  const activeGroups = groups.filter((g) => g.signal !== 0).length;
  const scoreBarPct = ((signals.score + signals.maxScore) / (signals.maxScore * 2)) * 100;

  const isStrong = signals.direction === "strong_long" || signals.direction === "strong_short";
  const isLong = signals.direction.includes("long");
  const isShort = signals.direction.includes("short");

  const distanceFromATH = coin.ath_change_percentage;
  const distanceFromATL = coin.atl_change_percentage;
  const midRange = (distanceFromATH + distanceFromATL) / 2;

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${
      isStrong
        ? isLong
          ? "border-emerald-500/40 bg-emerald-500/5"
          : "border-red-500/40 bg-red-500/5"
        : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-700 dark:hover:border-zinc-600"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-3">
          <img src={coin.image} alt={coin.name} className="w-10 h-10 rounded-full" loading="lazy" />
          <div>
            <div className="font-semibold text-sm text-zinc-100">{coin.name}</div>
            <div className="text-xs text-zinc-500 uppercase">{coin.symbol}</div>
          </div>
        </div>
        <SignalBadge
          direction={signals.direction}
          score={signals.score}
          maxScore={signals.maxScore}
        />
      </div>

      {/* Price + Score Bar */}
      <div className="px-4 pb-3">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-lg font-bold text-zinc-100">
            ${coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className={`text-sm font-medium ${coin.price_change_percentage_24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {coin.price_change_percentage_24h >= 0 ? "+" : ""}{coin.price_change_percentage_24h.toFixed(2)}%
          </span>
        </div>

        {/* Score bar */}
        <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all ${
              signals.score > 0 ? "bg-emerald-500" : signals.score < 0 ? "bg-red-500" : "bg-zinc-600"
            }`}
            style={{ width: `${Math.min(100, Math.max(0, scoreBarPct))}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-zinc-600">
          <span>-{signals.maxScore}</span>
          <span>0</span>
          <span>+{signals.maxScore}</span>
        </div>
      </div>

      {/* ATH/ATL Detailed */}
      <div className="mx-4 mb-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-zinc-900/50 p-2.5 text-center">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">From ATH</div>
          <div className={`text-sm font-bold ${distanceFromATH > -10 ? "text-red-400" : distanceFromATH < -70 ? "text-emerald-400" : "text-zinc-300"}`}>
            {distanceFromATH}%
          </div>
          <div className="text-[9px] text-zinc-600 mt-0.5">
            {coin.ath_date ? new Date(coin.ath_date).toLocaleDateString() : "N/A"}
          </div>
        </div>
        <div className="rounded-lg bg-zinc-900/50 p-2.5 text-center">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">From ATL</div>
          <div className="text-sm font-bold text-emerald-400">
            +{distanceFromATL}%
          </div>
          <div className="text-[9px] text-zinc-600 mt-0.5">
            {coin.atl_date ? new Date(coin.atl_date).toLocaleDateString() : "N/A"}
          </div>
        </div>
        <div className="rounded-lg bg-zinc-900/50 p-2.5 text-center">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Mid Range</div>
          <div className={`text-sm font-bold ${midRange > 0 ? "text-emerald-400" : "text-red-400"}`}>
            {midRange > 0 ? "+" : ""}{midRange.toFixed(1)}%
          </div>
          <div className="text-[9px] text-zinc-600 mt-0.5">
            {midRange > 20 ? "Above mid" : midRange < -20 ? "Below mid" : "Near mid"}
          </div>
        </div>
      </div>

      {/* Volume & Market Cap */}
      <div className="mx-4 mb-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-zinc-900/50 p-2 text-center">
          <div className="text-[9px] text-zinc-500">MCap</div>
          <div className="text-[11px] font-mono text-zinc-300">
            {coin.market_cap >= 1e9 ? `$${(coin.market_cap / 1e9).toFixed(1)}B` : `$${(coin.market_cap / 1e6).toFixed(0)}M`}
          </div>
        </div>
        <div className="rounded-lg bg-zinc-900/50 p-2 text-center">
          <div className="text-[9px] text-zinc-500">Volume</div>
          <div className="text-[11px] font-mono text-zinc-300">
            {coin.total_volume >= 1e9 ? `$${(coin.total_volume / 1e9).toFixed(1)}B` : `$${(coin.total_volume / 1e6).toFixed(0)}M`}
          </div>
        </div>
        <div className="rounded-lg bg-zinc-900/50 p-2 text-center">
          <div className="text-[9px] text-zinc-500">Vol/MCap</div>
          <div className={`text-[11px] font-mono ${coin.market_cap > 0 && coin.total_volume / coin.market_cap > 0.1 ? "text-amber-400" : "text-zinc-400"}`}>
            {coin.market_cap > 0 ? ((coin.total_volume / coin.market_cap) * 100).toFixed(1) : "0"}%
          </div>
        </div>
      </div>

      {/* Groups in 2 columns */}
      <div className="px-4 pb-3 grid grid-cols-2 gap-x-3">
        <div className="divide-y divide-zinc-800/50">
          {leftGroups.map((group) => (
            <GroupStatus key={group.name} group={group} />
          ))}
        </div>
        <div className="divide-y divide-zinc-800/50">
          {rightGroups.map((group) => (
            <GroupStatus key={group.name} group={group} />
          ))}
        </div>
      </div>

      {/* Footer stats */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/30 border-t border-zinc-800/50 text-[11px]">
        <div className="flex items-center gap-3">
          <span className="text-emerald-400">{longGroups}↑</span>
          <span className="text-zinc-500">{activeGroups - longGroups - shortGroups}—</span>
          <span className="text-red-400">{shortGroups}↓</span>
        </div>
        <div className="flex items-center gap-3 text-zinc-500">
          <span>{agreedCount}/{groups.length} agreed</span>
          <span>{signals.agreementPct}% conf</span>
        </div>
      </div>
    </div>
  );
}
