"use client";

import { X, Trophy, TrendingDown } from "lucide-react";
import { useEffect } from "react";
import { useNavStore } from "@/lib/navStore";
import type { CoinWithDerived } from "@/types/coin";
import type { CoinDetailExtra } from "@/types/nav";
import { formatUSD, formatCompact } from "@/lib/format";

export type { CoinDetailExtra };

export function CoinModal({
  coin,
  extra,
}: {
  coin: CoinWithDerived | null;
  extra?: CoinDetailExtra;
}) {
  const modalSymbol = useNavStore((s) => s.modalSymbol);
  const closeModal = useNavStore((s) => s.closeModal);

  useEffect(() => {
    if (!modalSymbol) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [modalSymbol, closeModal]);

  if (!modalSymbol || !coin) return null;

  const sparkline = coin.sparkline_in_7d?.price ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <button
        aria-label="Close"
        onClick={closeModal}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default"
      />
      <div className="relative w-full sm:max-w-lg max-h-[92vh] overflow-auto rounded-t-2xl sm:rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-fade-in shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <img src={coin.image} alt={coin.name} className="w-9 h-9 rounded-full" loading="lazy" />
            <div>
              <div className="font-semibold text-sm">{coin.name}</div>
              <div className="text-xs text-zinc-500 uppercase">{coin.symbol}</div>
            </div>
          </div>
          <button
            onClick={closeModal}
            aria-label="Close"
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold">${coin.current_price.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
            <span className={`text-sm font-medium ${coin.price_change_percentage_24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {coin.price_change_percentage_24h >= 0 ? "+" : ""}
              {coin.price_change_percentage_24h.toFixed(2)}%
            </span>
          </div>

          {/* ATH / ATL */}
          <div className="grid grid-cols-2 gap-3">
            <StatTile
              icon={<Trophy className="w-4 h-4 text-amber-400" />}
              label="ATH"
              value={`$${coin.ath.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
              sub={`${coin.ath_change_percentage.toFixed(2)}% · ${coin.ath_date ? new Date(coin.ath_date).toLocaleDateString() : ""}`}
            />
            <StatTile
              icon={<TrendingDown className="w-4 h-4 text-emerald-400" />}
              label="ATL"
              value={`$${coin.atl.toLocaleString(undefined, { maximumFractionDigits: 6 })}`}
              sub={`+${coin.atl_change_percentage.toFixed(2)}% · ${coin.atl_date ? new Date(coin.atl_date).toLocaleDateString() : ""}`}
            />
          </div>

          {/* Key stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatMini label="Market Cap" value={formatCompact(coin.market_cap)} />
            <StatMini label="Volume 24h" value={formatCompact(coin.total_volume)} />
            <StatMini label="Rank" value={`#${coin.market_cap_rank ?? "—"}`} />
          </div>

          {/* Sparkline */}
          {sparkline.length > 0 && (
            <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">7d Trend</div>
              <div className="h-20">
                <Sparkline data={sparkline} />
              </div>
            </div>
          )}

          {/* Derived: liquidation 24h */}
          {coin.liquidation24h && (
            <div className="grid grid-cols-3 gap-3 text-center">
              <StatMini label="Liq Long" value={`${coin.liquidation24h.longPct.toFixed(0)}%`} />
              <StatMini label="Liq Short" value={`${coin.liquidation24h.shortPct.toFixed(0)}%`} />
              <StatMini label="Direction" value={coin.liquidation24h.netDirection} />
            </div>
          )}

          {/* O/U extra */}
          {extra?.overvalued && <OvervaluedSection result={extra.overvalued} />}

          {/* Liq signal extra */}
          {extra?.liq && <LiqSection signal={extra.liq} />}
        </div>
      </div>
    </div>
  );
}

function StatTile({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800/50 p-3">
      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
        {icon}{label}
      </div>
      <div className="font-mono font-semibold text-sm">{value}</div>
      <div className="text-[11px] text-zinc-500 mt-0.5">{sub}</div>
    </div>
  );
}

function StatMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800/50 p-2.5 text-center">
      <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="font-mono text-xs font-semibold">{value}</div>
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${100 - ((v - min) / range) * 100}`)
    .join(" ");
  const color = data[data.length - 1] >= data[0] ? "#10b981" : "#ef4444";
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function OvervaluedSection({ result }: { result: NonNullable<CoinDetailExtra["overvalued"]> }) {
  const isOver = result.direction === "overvalued";
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold ${isOver ? "text-red-400" : "text-emerald-400"}`}>
          {isOver ? "SHORT SETUP" : "LONG SETUP"}
        </span>
        <span className="text-xs text-zinc-500">Opportunity {Math.round(result.opportunityScore)}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-zinc-500">{isOver ? "Short Entry" : "Long Entry"}</span>
        <span className="font-mono text-amber-300">${result.predictedEntry.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-zinc-500">Reversal</span>
        <span className="font-mono">{Math.round(result.reversalProbability)}%</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-zinc-500">Confidence</span>
        <span className="font-mono">{Math.round(result.finalConfidence)}%</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-zinc-500">R:R</span>
        <span className="font-mono">{result.expectedRewardRisk.toFixed(1)}</span>
      </div>
    </div>
  );
}

function LiqSection({ signal }: { signal?: NonNullable<CoinDetailExtra["liq"]> }) {
  if (!signal) return null;
  const isLong = signal.side === "long";
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold ${isLong ? "text-emerald-400" : "text-red-400"}`}>
          LIQUIDATION {isLong ? "LONG DOMINANT" : "SHORT DOMINANT"}
        </span>
        <span className="text-xs text-zinc-500">{signal.timeframe}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-zinc-500">Total</span>
        <span className="font-mono">{formatUSD(signal.totalUsd)}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-zinc-500">Long / Short</span>
        <span className="font-mono">{signal.longPct.toFixed(0)}% / {signal.shortPct.toFixed(0)}%</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-zinc-500">Forecast</span>
        <span className={`font-mono ${signal.predictedPump ? "text-emerald-400" : "text-red-400"}`}>
          {signal.predictedPump ? "PUMP" : "DUMP"}
        </span>
      </div>
    </div>
  );
}