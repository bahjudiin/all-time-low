"use client";

import { SignalBadge } from "./SignalBadge";
import { GroupStatus } from "./GroupStatus";
import type { CoinSignals } from "@/types/signal";

interface SignalCardProps {
  name: string;
  symbol: string;
  image: string;
  price: number;
  change24h: number;
  signals: CoinSignals;
}

export function SignalCard({ name, symbol, image, price, change24h, signals }: SignalCardProps) {
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
  const activeGroups = groups.filter((g) => g.signal !== 0).length;
  const longGroups = groups.filter((g) => g.signal === 1).length;
  const shortGroups = groups.filter((g) => g.signal === -1).length;

  const scoreBarPct = ((signals.score + signals.maxScore) / (signals.maxScore * 2)) * 100;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:border-zinc-700 dark:hover:border-zinc-600 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-3">
          <img src={image} alt={name} className="w-10 h-10 rounded-full" loading="lazy" />
          <div>
            <div className="font-semibold text-sm text-zinc-100">{name}</div>
            <div className="text-xs text-zinc-500 uppercase">{symbol}</div>
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
            ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span
            className={`text-sm font-medium ${
              change24h >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {change24h >= 0 ? "+" : ""}
            {change24h.toFixed(2)}%
          </span>
        </div>

        {/* Score bar */}
        <div className="relative h-1.5 bg-zinc-800 rounded-full overflow-hidden">
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

      {/* ATH/ATL quick stats */}
      {signals.athAtl && (
        <div className="mx-4 mb-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-zinc-900/50 p-2">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">From ATH</div>
            <div className={`text-sm font-bold ${signals.athAtl.distanceFromATH > -10 ? "text-red-400" : signals.athAtl.distanceFromATH < -70 ? "text-emerald-400" : "text-zinc-300"}`}>
              {signals.athAtl.distanceFromATH}%
            </div>
          </div>
          <div className="rounded-lg bg-zinc-900/50 p-2">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">From ATL</div>
            <div className="text-sm font-bold text-emerald-400">
              +{signals.athAtl.distanceFromATL}%
            </div>
          </div>
          <div className="rounded-lg bg-zinc-900/50 p-2">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Mid Range</div>
            <div className={`text-sm font-bold ${signals.athAtl.midRangePct > 0 ? "text-emerald-400" : "text-red-400"}`}>
              {signals.athAtl.midRangePct > 0 ? "+" : ""}{signals.athAtl.midRangePct}%
            </div>
          </div>
        </div>
      )}

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
