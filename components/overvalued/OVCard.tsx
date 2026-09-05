"use client";

import type { OvervaluedUndervaluedResult } from "@/lib/overvaluedUndervalued";

interface OVCardProps {
  result: OvervaluedUndervaluedResult;
}

function valuationLabel(result: OvervaluedUndervaluedResult): string {
  const score = result.direction === "overvalued"
    ? result.overvaluationScore
    : result.direction === "undervalued"
    ? result.undervaluationScore
    : 0;

  if (result.direction === "overvalued") {
    if (score >= 85) return "EXTREMELY OVERVALUED";
    if (score >= 70) return "OVERVALUED";
    if (score >= 55) return "MILDLY OVERVALUED";
    return "FAIR";
  }
  if (result.direction === "undervalued") {
    if (score >= 85) return "EXTREMELY UNDERVALUED";
    if (score >= 70) return "UNDERVALUED";
    if (score >= 55) return "MILDLY UNDERVALUED";
    return "FAIR";
  }
  return "FAIR";
}

function opportunityLabel(result: OvervaluedUndervaluedResult): string {
  const opp = result.opportunityScore;
  if (opp >= 85) return "EXTREME";
  if (opp >= 70) return "STRONG";
  if (opp >= 55) return "GOOD";
  if (opp >= 40) return "WATCH";
  return "NO SETUP";
}

function stateBadgeClasses(state: string): string {
  switch (state) {
    case "ENTRY_TOUCHED": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
    case "ENTRY_NEAR": return "bg-blue-500/20 text-blue-400 border-blue-500/40";
    case "INVALIDATED": return "bg-red-500/20 text-red-400 border-red-500/40";
    case "WAITING_FOR_ENTRY": return "bg-amber-500/20 text-amber-400 border-amber-500/40";
    case "EXTREME": return "bg-red-500/10 text-red-300 border-red-500/30";
    default: return "bg-zinc-500/10 text-zinc-400 border-zinc-500/30";
  }
}

export function OVCard({ result }: OVCardProps) {
  const isOver = result.direction === "overvalued";
  const isUnder = result.direction === "undervalued";
  const borderColor = isOver
    ? "border-red-500/40 bg-red-500/5"
    : isUnder
    ? "border-emerald-500/40 bg-emerald-500/5"
    : "border-zinc-200 dark:border-zinc-800";

  const f = result.factors;

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${borderColor}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-3">
          <img src={result.image} alt={result.name} className="w-10 h-10 rounded-full" loading="lazy" />
          <div>
            <div className="font-semibold text-sm text-zinc-100">{result.name}</div>
            <div className="text-xs text-zinc-500 uppercase">{result.symbol}</div>
          </div>
        </div>
        <span className={`px-2 py-1 text-[10px] font-bold rounded-md border ${stateBadgeClasses(result.signalState)}`}>
          {result.signalState.replace(/_/g, " ")}
        </span>
      </div>

      {/* Valuation label */}
      <div className="px-4 pb-1">
        <div className={`text-sm font-bold ${isOver ? "text-red-400" : isUnder ? "text-emerald-400" : "text-zinc-400"}`}>
          {valuationLabel(result)}
        </div>
        <div className="text-[10px] text-zinc-500">Opportunity: {opportunityLabel(result)}</div>
      </div>

      {/* Score grid */}
      <div className="px-4 py-2 grid grid-cols-2 gap-2">
        <ScoreBox label="Opportunity" value={result.opportunityScore} />
        <ScoreBox label={isOver ? "Overvaluation" : isUnder ? "Undervaluation" : "Valuation"}
          value={isOver ? result.overvaluationScore : isUnder ? result.undervaluationScore : 0} />
        <ScoreBox label="Reversal" value={result.reversalProbability} />
        <ScoreBox label="Confidence" value={result.finalConfidence} />
      </div>

      {/* Price + Entry */}
      <div className="mx-4 py-2 px-3 rounded-lg bg-zinc-900/50 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Current</span>
          <span className="font-mono text-zinc-200">${result.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">{isOver ? "Short Entry" : isUnder ? "Long Entry" : "Predicted"}</span>
          <span className="font-mono text-amber-300">${result.predictedEntry.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Zone</span>
          <span className="font-mono text-zinc-300">${result.entryZoneLower.toLocaleString(undefined, { maximumFractionDigits: 6 })} – ${result.entryZoneUpper.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Distance</span>
          <span className={`font-mono ${result.distanceToEntryPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {result.distanceToEntryPct > 0 ? "+" : ""}{result.distanceToEntryPct.toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Invalidation</span>
          <span className="font-mono text-red-400">${result.invalidation.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Mean Target</span>
          <span className="font-mono text-zinc-300">${result.t2Target.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">R:R</span>
          <span className={`font-mono ${result.expectedRewardRisk >= 2 ? "text-emerald-400" : result.expectedRewardRisk >= 1.5 ? "text-amber-400" : "text-red-400"}`}>
            {result.expectedRewardRisk.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Key data */}
      <div className="px-4 py-2 grid grid-cols-3 gap-x-2 gap-y-1 text-[11px]">
        <div className="flex justify-between">
          <span className="text-zinc-500">VWAP Δ</span>
          <span className={`font-mono ${f.fairValue.combinedDeviation > 0 ? "text-red-400" : "text-emerald-400"}`}>
            {f.fairValue.combinedDeviation > 0 ? "+" : ""}{f.fairValue.combinedDeviation}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">RSI 1H</span>
          <span className="font-mono text-zinc-300">{f.momentum.rsi1h}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Funding</span>
          <span className={`font-mono ${f.crowding.fundingRate > 0 ? "text-red-400" : f.crowding.fundingRate < 0 ? "text-emerald-400" : "text-zinc-300"}`}>
            {f.crowding.fundingRate > 0 ? "+" : ""}{f.crowding.fundingRate}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">OI 1H</span>
          <span className="font-mono text-zinc-300">{f.crowding.oiChange1hPct > 0 ? "+" : ""}{f.crowding.oiChange1hPct}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Volume</span>
          <span className="font-mono text-zinc-300">{f.volume.volumeRatio.toFixed(1)}x</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Regime</span>
          <span className="font-mono text-zinc-300">{result.marketRegime}</span>
        </div>
      </div>

      {/* Why */}
      {result.reasons.length > 0 && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-lg bg-zinc-900/40">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Why</div>
          {result.reasons.map((r, i) => (
            <div key={i} className="text-[11px] text-zinc-300 flex items-start gap-1.5">
              <span className="text-emerald-400 leading-none mt-0.5">✓</span>
              <span>{r}</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/30 border-t border-zinc-800/50 text-[10px] text-zinc-500">
        <span>Conflict {result.conflictScore}</span>
        <span>Data Q {result.dataQuality}</span>
        <span>Entry Q {result.entryQuality}</span>
        <span>{new Date(result.lastUpdate).toLocaleTimeString()}</span>
      </div>
    </div>
  );
}

function ScoreBox({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const color = pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : pct >= 25 ? "bg-zinc-500" : "bg-red-500";
  return (
    <div className="rounded-lg bg-zinc-900/50 p-2">
      <div className="text-[10px] text-zinc-500 mb-1">{label}</div>
      <div className="text-sm font-bold text-zinc-100">{Math.round(value)}</div>
      <div className="h-1 bg-zinc-800 rounded-full mt-1 overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}