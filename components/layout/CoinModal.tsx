"use client";

import { X, Trophy, TrendingDown, Activity, Target, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useNavStore } from "@/lib/navStore";
import type { CoinWithDerived } from "@/types/coin";
import type { CoinDetailExtra } from "@/types/nav";
import { Tooltip } from "@/components/ui/Tooltip";
import { formatUSD, formatCompact } from "@/lib/format";
import type { LiquidationEvent } from "@/types/liquidation";

export type { CoinDetailExtra };

type Section = "overview" | "valuation" | "liq";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function CoinModal({
  coin,
  extra,
}: {
  coin: CoinWithDerived | null;
  extra?: CoinDetailExtra;
}) {
  const modalSymbol = useNavStore((s) => s.modalSymbol);
  const closeModal = useNavStore((s) => s.closeModal);
  const [section, setSection] = useState<Section>("overview");
  const [lastSymbol, setLastSymbol] = useState(modalSymbol);

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

  if (modalSymbol !== lastSymbol) {
    setLastSymbol(modalSymbol);
    setSection("overview");
  }

  if (!modalSymbol || !coin) return null;

  const hasValuation = !!extra?.overvalued;
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
      <div className="relative w-full sm:max-w-lg max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-fade-in shadow-2xl">
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

        {/* Section tabs */}
        <div className="flex items-center gap-1 px-4 pt-2 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
          <SectionTab active={section === "overview"} onClick={() => setSection("overview")}>
            Overview
          </SectionTab>
          {hasValuation && (
            <SectionTab active={section === "valuation"} onClick={() => setSection("valuation")}>
              Valuation
            </SectionTab>
          )}
          <SectionTab active={section === "liq"} onClick={() => setSection("liq")}>
            Liquidation
          </SectionTab>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-4">
          {section === "overview" && <OverviewSection coin={coin} extra={extra} sparkline={sparkline} />}
          {section === "valuation" && extra?.overvalued && <ValuationSection result={extra.overvalued} coin={coin} />}
          {section === "liq" && <LiqSection coin={coin} signal={extra?.liq} />}
        </div>
      </div>
    </div>
  );
}

function SectionTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
        active
          ? "border-blue-600 text-blue-600 dark:text-blue-400"
          : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
      }`}
    >
      {children}
    </button>
  );
}

function OverviewSection({
  coin,
  extra,
  sparkline,
}: {
  coin: CoinWithDerived;
  extra?: CoinDetailExtra;
  sparkline: number[];
}) {
  const isUp = coin.price_change_percentage_24h >= 0;

  return (
    <>
      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-bold">${coin.current_price.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
        <span className={`text-sm font-medium ${isUp ? "text-emerald-400" : "text-red-400"}`}>
          {isUp ? "+" : ""}
          {coin.price_change_percentage_24h.toFixed(2)}%
        </span>
        <span className="text-xs text-zinc-500">
          24h {formatUSD(coin.low_24h)} – {formatUSD(coin.high_24h)}
        </span>
      </div>

      {/* ATH / ATL */}
      <div className="grid grid-cols-2 gap-3">
        <StatTile
          icon={<Trophy className="w-4 h-4 text-amber-400" />}
          label="ATH"
          value={`$${coin.ath.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          sub={`${coin.ath_change_percentage.toFixed(2)}% · ${coin.ath_date ? new Date(coin.ath_date).toLocaleDateString() : ""}`}
          tooltip="All-time high price and % below it"
        />
        <StatTile
          icon={<TrendingDown className="w-4 h-4 text-emerald-400" />}
          label="ATL"
          value={`$${coin.atl.toLocaleString(undefined, { maximumFractionDigits: 6 })}`}
          sub={`+${coin.atl_change_percentage.toFixed(2)}% · ${coin.atl_date ? new Date(coin.atl_date).toLocaleDateString() : ""}`}
          tooltip="All-time low price and % above it"
        />
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatMini label="Market Cap" value={formatCompact(coin.market_cap)} tooltip="Circulating-supply market cap" />
        <StatMini label="Volume 24h" value={formatCompact(coin.total_volume)} tooltip="24h traded volume" />
        <StatMini label="Rank" value={`#${coin.market_cap_rank ?? "—"}`} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <StatMini label="Circ Supply" value={formatCompact(coin.circulating_supply)} />
        <StatMini label="Max Supply" value={coin.max_supply ? formatCompact(coin.max_supply) : "∞"} tooltip="Total maximum supply if defined" />
        <StatMini label="FDV" value={coin.fully_diluted_valuation ? formatCompact(coin.fully_diluted_valuation) : "—"} tooltip="Fully diluted valuation" />
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
          <StatMini label="Liq Long" value={`${coin.liquidation24h.longPct.toFixed(0)}%`} tooltip="Share of 24h notional liquidations that were longs" />
          <StatMini label="Liq Short" value={`${coin.liquidation24h.shortPct.toFixed(0)}%`} tooltip="Share of 24h notional liquidations that were shorts" />
          <StatMini label="Direction" value={coin.liquidation24h.netDirection.toUpperCase()} />
        </div>
      )}

      {/* O/U quick summary */}
      {extra?.overvalued && <OvervaluedSummary result={extra.overvalued} />}

      {/* Liq signal quick summary */}
      {extra?.liq && <LiqSignalSummary signal={extra.liq} />}
    </>
  );
}

function ValuationSection({
  result,
  coin,
}: {
  result: NonNullable<CoinDetailExtra["overvalued"]>;
  coin: CoinWithDerived;
}) {
  const isOver = result.direction === "overvalued";
  const F = result.factors;

  const entryRows: { label: string; value: string; tooltip?: string; color?: string }[] = [
    { label: "Entry", value: `$${result.predictedEntry.toLocaleString(undefined, { maximumFractionDigits: 6 })}`, tooltip: "Predicted reversal entry price", color: "text-amber-300" },
    { label: "Zone", value: `${formatUSD(result.entryZoneLower)} – ${formatUSD(result.entryZoneUpper)}`, tooltip: "Entry zone window (ATR-based)" },
    { label: "Invalidation", value: `${formatUSD(result.invalidation)}`, tooltip: "Stops the setup if traded", color: "text-red-400" },
    { label: "T1", value: `${formatUSD(result.t1Target)}`, tooltip: "Take-profit 1" },
    { label: "T2", value: `${formatUSD(result.t2Target)}`, tooltip: "Take-profit 2" },
    { label: "T3", value: `${formatUSD(result.t3Target)}`, tooltip: "Take-profit 3" },
    { label: "R:R", value: result.expectedRewardRisk.toFixed(1), tooltip: "Reward-to-risk to T2" },
    { label: "Entry Quality", value: `${result.entryQuality.toFixed(0)}/100`, tooltip: "Quality of the entry window" },
    { label: "Dist to Entry", value: `${result.distanceToEntryPct.toFixed(2)}%`, tooltip: "Current distance to predicted entry" },
  ];

  const factorRows: { label: string; value: string; tooltip?: string }[] = [
    {
      label: "Fair Value",
      value: `${F.fairValue.combinedDeviation > 0 ? "+" : ""}${F.fairValue.combinedDeviation}% (${F.fairValue.score.toFixed(0)})`,
      tooltip: "Weighted deviation from VWAP and EMA50/200",
    },
    {
      label: "Momentum",
      value: `RSI ${F.momentum.weightedRsi.toFixed(0)} (${F.momentum.score.toFixed(0)})`,
      tooltip: `15m ${F.momentum.rsi15m.toFixed(0)} / 1H ${F.momentum.rsi1h.toFixed(0)} / 4H ${F.momentum.rsi4h.toFixed(0)}`,
    },
    {
      label: "Crowding",
      value: `${F.crowding.fundingRate > 0 ? "+" : ""}${F.crowding.fundingRate}% · L/S ${F.crowding.longShortRatio.toFixed(2)} (${F.crowding.score.toFixed(0)})`,
      tooltip: `Funding ${F.crowding.fundingPercentile.toFixed(0)}th pctile · OI rel ${F.crowding.priceOiRelationship}`,
    },
    { label: "Volume", value: `${F.volume.volumeRatio.toFixed(1)}x avg (${F.volume.score.toFixed(0)})`, tooltip: "Last 15m candle vs 20-candle average" },
    {
      label: "Volatility",
      value: `ATR ${F.volatility.atrNormalized.toFixed(2)}% · BB ${(F.volatility.bbPosition * 100).toFixed(0)}% (${F.volatility.score.toFixed(0)})`,
      tooltip: `Vol percentile ${F.volatility.volatilityPercentile.toFixed(0)}`,
    },
    {
      label: "Structure",
      value: renderStructure(F),
      tooltip: "Local highs/lows and failed breakout/breakdown detection",
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className={`text-sm font-semibold ${isOver ? "text-red-400" : "text-emerald-400"}`}>
          {isOver ? "● SHORT SETUP" : "● LONG SETUP"}
        </span>
        <Tooltip label="Composite opportunity score">
          <span className="text-xs font-mono text-zinc-400">Opp {Math.round(result.opportunityScore)}</span>
        </Tooltip>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatMini label="State" value={result.signalState} tooltip="Signal state machine stage" />
        <StatMini label="Regime" value={result.marketRegime} tooltip="Classified market regime" />
      </div>
      <div className="grid grid-cols-4 gap-3">
        <StatMini label="Reversal" value={`${Math.round(result.reversalProbability)}%`} tooltip="Estimated reversal probability" />
        <StatMini label="Continuation" value={`${Math.round(result.continuationProbability)}%`} tooltip="Estimated trend continuation probability" />
        <StatMini label="Conf" value={`${Math.round(result.finalConfidence)}%`} tooltip="Final confidence after conflict penalty" />
        <StatMini label="Data Q" value={`${Math.round(result.dataQuality)}%`} tooltip="Data quality score" />
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-zinc-500 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
          <Target className="w-3.5 h-3.5" /> Entry Setup
          <span className="ml-auto text-[10px] text-zinc-400">Price {formatUSD(result.currentPrice)}</span>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
          {entryRows.map((r) => (
            <div key={r.label} className="flex items-center justify-between px-3 py-1.5 text-xs">
              {r.tooltip ? (
                <Tooltip label={r.tooltip} className="flex-1 mr-2">
                  <span className="text-zinc-500">{r.label}</span>
                </Tooltip>
              ) : (
                <span className="text-zinc-500">{r.label}</span>
              )}
              <span className={`font-mono ${r.color ?? "text-zinc-700 dark:text-zinc-200"}`}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-zinc-500 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
          <Activity className="w-3.5 h-3.5" /> Factor Breakdown
          <span className="ml-auto text-[10px] text-zinc-400">weights {result.factorWeights.fairValueDeviation}/{result.factorWeights.momentumExhaustion}/{result.factorWeights.futuresCrowding}/{result.factorWeights.volumeParticipation}/{result.factorWeights.volatilityPosition}/{result.factorWeights.marketStructure}/{result.factorWeights.liquidationPressure}</span>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
          {factorRows.map((r) => (
            <div key={r.label} className="flex items-center justify-between px-3 py-1.5 text-xs">
              {r.tooltip ? (
                <Tooltip label={r.tooltip} className="flex-1 mr-2">
                  <span className="text-zinc-500">{r.label}</span>
                </Tooltip>
              ) : (
                <span className="text-zinc-500">{r.label}</span>
              )}
              <span className="font-mono text-zinc-700 dark:text-zinc-200">{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {result.reasons.length > 0 && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 flex items-center gap-3">
            <CheckCircle2 className="w-3.5 h-3.5" /> Reasons
          </div>
          {result.reasons.map((r, i) => (
            <p key={i} className="text-[11px] text-zinc-600 dark:text-zinc-300">• {r}</p>
          ))}
        </div>
      )}

      {result.conflicts.length > 0 && (
        <div className="rounded-xl border border-red-300/30 dark:border-red-500/30 bg-red-50 dark:bg-red-950/20 p-3 space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-red-400 flex items-center gap-3">
            <AlertTriangle className="w-3.5 h-3.5" /> Conflicts {result.conflictScore > 0 ? `(${Math.round(result.conflictScore)})` : ""}
          </div>
          {result.conflicts.map((c, i) => (
            <p key={i} className="text-[11px] text-red-500/90 dark:text-red-300/90">• {c}</p>
          ))}
        </div>
      )}

      <p className="text-[10px] text-zinc-500">
        Base: {coin.name.split(" ")[0]} · Last update {new Date(result.lastUpdate).toLocaleTimeString()}. Statistical fair-value analysis only.
      </p>
    </>
  );
}

function renderStructure(f: NonNullable<CoinDetailExtra["overvalued"]>["factors"]): string {
  const parts: string[] = [];
  if (f.structure.failedBreakout) parts.push("failed breakout");
  if (f.structure.failedBreakdown) parts.push("failed breakdown");
  if (f.structure.lowerHigh) parts.push("lower high");
  if (f.structure.higherLow) parts.push("higher low");
  if (f.structure.breakout) parts.push("breakout");
  return parts.length ? parts.join(", ") : "neutral";
}

function LiqSection({
  coin,
  signal,
}: {
  coin: CoinWithDerived;
  signal?: CoinDetailExtra["liq"];
}) {
  const { data } = useSWR<{ events: LiquidationEvent[]; meta: { total: number } }>(
    `/api/liquidations/history?symbol=${encodeURIComponent(coin.symbol.toUpperCase())}`,
    fetcher,
    { refreshInterval: 30_000, revalidateOnFocus: false }
  );

  const events = useMemo(() => data?.events ?? [], [data]);

  const aggregates = useMemo(() => {
    const longUsd = events.filter((e) => e.side === "long").reduce((s, e) => s + e.usdValue, 0);
    const shortUsd = events.filter((e) => e.side === "short").reduce((s, e) => s + e.usdValue, 0);
    const total = longUsd + shortUsd;
    return {
      longUsd,
      shortUsd,
      total,
      longPct: total > 0 ? (longUsd / total) * 100 : 0,
    };
  }, [events]);

  return (
    <>
      {signal && <LiqSignalSummary signal={signal} />}

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">
            OKX Liquidation Events · {events.length} in window
          </span>
          <span className="text-[10px] text-zinc-400">fresh {data ? "· live" : ""}</span>
        </div>
        {events.length === 0 ? (
          <p className="text-xs text-zinc-500 py-4 text-center">
            No recent OKX liquidation events for {coin.symbol.toUpperCase()}.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs mt-2">
              <Tooltip label="Long-liquidated notional ($)">
                <span className="text-zinc-500 inline-flex">Longs</span>
              </Tooltip>
              <span className="font-mono text-emerald-400">{formatCompact(aggregates.longUsd)}</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <Tooltip label="Short-liquidated notional ($)">
                <span className="text-zinc-500 inline-flex">Shorts</span>
              </Tooltip>
              <span className="font-mono text-red-400">{formatCompact(aggregates.shortUsd)}</span>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <div className="h-1.5 flex-1 rounded-full bg-emerald-500" style={{ width: `${aggregates.longPct}%` }} />
              <div className="h-1.5 flex-1 rounded-full bg-red-500" style={{ width: `${100 - aggregates.longPct}%` }} />
            </div>
            <div className="overflow-auto max-h-72 mt-2">
              <table className="w-full text-[11px]">
                <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900 text-left text-zinc-500">
                  <tr>
                    <th className="px-2 py-1 font-medium">Time</th>
                    <th className="px-2 py-1 font-medium">Side</th>
                    <th className="px-2 py-1 font-medium">Price</th>
                    <th className="px-2 py-1 font-medium">Qty</th>
                    <th className="px-2 py-1 font-medium">USD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                  {events.slice(0, 40).map((e) => (
                    <tr key={e.id}>
                      <td className="px-2 py-1 text-zinc-500 whitespace-nowrap">{new Date(e.ts).toLocaleTimeString()}</td>
                      <td className={`px-2 py-1 font-medium ${e.side === "long" ? "text-emerald-400" : "text-red-400"}`}>
                        {e.side === "long" ? "LONG" : "SHORT"}
                      </td>
                      <td className="px-2 py-1 font-mono">{formatUSD(e.price)}</td>
                      <td className="px-2 py-1 font-mono text-zinc-400">{e.qty}</td>
                      <td className="px-2 py-1 font-mono">{formatCompact(e.usdValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export function OvervaluedSummary({ result }: { result: NonNullable<CoinDetailExtra["overvalued"]> }) {
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
        <span className="text-zinc-500">Reversal / Conf</span>
        <span className="font-mono">
          {Math.round(result.reversalProbability)}% / {Math.round(result.finalConfidence)}%
        </span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-zinc-500">R:R</span>
        <span className="font-mono">{result.expectedRewardRisk.toFixed(1)}</span>
      </div>
    </div>
  );
}

export function LiqSignalSummary({ signal }: { signal: NonNullable<CoinDetailExtra["liq"]> }) {
  const isLong = signal.side === "long";
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold ${isLong ? "text-emerald-400" : "text-red-400"}`}>
          LIQUIDATION {signal.side.toUpperCase()}
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
        <span className="text-zinc-500">Agreement</span>
        <span className={`font-mono ${signal.agreementPct >= 80 ? "text-emerald-400" : "text-amber-400"}`}>
          {signal.agreementPct.toFixed(0)}% ({signal.agreementSamples} TF)
        </span>
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

function StatTile({
  icon,
  label,
  value,
  sub,
  tooltip,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tooltip?: string;
}) {
  return (
    <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800/50 p-3">
      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
        {icon}
        {tooltip ? <Tooltip label={tooltip}>{label}</Tooltip> : label}
      </div>
      <div className="font-mono font-semibold text-sm">{value}</div>
      <div className="text-[11px] text-zinc-500 mt-0.5">{sub}</div>
    </div>
  );
}

function StatMini({ label, value, tooltip }: { label: string; value: string; tooltip?: string }) {
  return (
    <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800/50 p-2.5 text-center">
      <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
        {tooltip ? <Tooltip label={tooltip}>{label}</Tooltip> : label}
      </div>
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