"use client";

import type { CoinPrediction } from "@/types/prediction";
import { PredictionChart } from "./PredictionChart";

interface PredictionDetailProps {
  prediction: CoinPrediction;
  onClose: () => void;
}

function formatPrice(n: number): string {
  if (n >= 1000) return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(6)}`;
}

function GaugeBar({
  label,
  value,
  max = 100,
  color,
  showPercent = true,
}: {
  label: string;
  value: number;
  max?: number;
  color: string;
  showPercent?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="mb-2">
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-[10px] text-zinc-500">{label}</span>
        {showPercent && (
          <span className="text-[10px] font-mono text-zinc-400">{value}%</span>
        )}
      </div>
      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function FactorList({
  title,
  factors,
  color,
}: {
  title: string;
  factors: string[];
  color: string;
}) {
  if (factors.length === 0) return null;
  return (
    <div className="mb-3">
      <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
        {title}
      </div>
      <div className="space-y-0.5">
        {factors.map((f, i) => (
          <div key={i} className={`text-[11px] ${color}`}>
            {f}
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 mt-3 first:mt-0">
      {children}
    </div>
  );
}

export function PredictionDetail({ prediction, onClose }: PredictionDetailProps) {
  const p = prediction;
  const f = p.factors;

  return (
    <div className="p-4 h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <img src={p.image} alt={p.name} className="w-7 h-7 rounded-full" />
          <div>
            <div className="font-semibold text-sm">{p.symbol}</div>
            <div className="text-[10px] text-zinc-500">{p.name}</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-foreground transition-colors text-lg leading-none"
        >
          ×
        </button>
      </div>

      {/* Price & Direction */}
      <div className="flex items-baseline gap-3 mb-3">
        <span className="text-xl font-bold font-mono">{formatPrice(p.currentPrice)}</span>
        <span
          className={`text-sm font-bold ${
            p.direction === "SHORT" ? "text-red-400" : "text-green-400"
          }`}
        >
          {p.direction}
        </span>
        <span
          className={`text-xs px-1.5 py-0.5 rounded font-bold ${
            p.quality === "A+"
              ? "bg-amber-500/20 text-amber-400"
              : p.quality === "A"
              ? "bg-green-500/20 text-green-400"
              : p.quality === "B"
              ? "bg-blue-500/20 text-blue-400"
              : "bg-zinc-500/20 text-zinc-400"
          }`}
        >
          {p.quality}
        </span>
      </div>

      {/* Chart */}
      <div className="mb-4 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <PredictionChart prediction={p} />
      </div>

      {/* Probabilities */}
      <SectionTitle>Probabilities</SectionTitle>
      <GaugeBar
        label="Exhaustion"
        value={p.exhaustionProbability}
        color={
          p.exhaustionProbability >= 70
            ? "bg-red-500"
            : p.exhaustionProbability >= 50
            ? "bg-amber-500"
            : "bg-zinc-600"
        }
      />
      <GaugeBar
        label="Continuation"
        value={p.continuationProbability}
        color={
          p.continuationProbability <= 30
            ? "bg-green-500"
            : "bg-zinc-600"
        }
      />
      <GaugeBar
        label="Zone Reach"
        value={p.zoneReachProbability}
        color="bg-blue-500"
      />

      {/* Cluster Confluence */}
      <SectionTitle>Cluster Confluence</SectionTitle>
      <div className="mb-3 space-y-1.5">
        {p.clusterVotes.map((cluster) => {
          const expectedVote = p.direction === "SHORT" ? -1 : 1;
          const isAgreeing = cluster.vote === expectedVote;
          const isConflicting = cluster.vote !== 0 && cluster.vote !== expectedVote;
          const isNeutral = cluster.vote === 0;

          return (
            <div
              key={cluster.name}
              className={`rounded-lg p-2 border ${
                isAgreeing
                  ? "border-green-500/30 bg-green-500/5"
                  : isConflicting
                  ? "border-red-500/30 bg-red-500/5"
                  : "border-zinc-800 bg-zinc-900/30"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isAgreeing ? "bg-green-500" : isConflicting ? "bg-red-500" : "bg-zinc-600"
                    }`}
                  />
                  <span className="text-[11px] font-medium text-foreground">{cluster.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-mono ${
                    isAgreeing ? "text-green-400" : isConflicting ? "text-red-400" : "text-zinc-500"
                  }`}>
                    {isAgreeing ? "AGREES" : isConflicting ? "CONFLICTS" : "NEUTRAL"}
                  </span>
                  <div className="w-8 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isAgreeing ? "bg-green-500" : isConflicting ? "bg-red-500" : "bg-zinc-600"
                      }`}
                      style={{ width: `${cluster.confidence}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-zinc-500">{cluster.confidence}%</span>
                </div>
              </div>
              {cluster.factors.length > 0 && (
                <div className="space-y-0.5 ml-3.5">
                  {cluster.factors.map((factor, i) => (
                    <div key={i} className={`text-[10px] ${
                      isAgreeing ? "text-green-400/70" : isConflicting ? "text-red-400/70" : "text-zinc-500"
                    }`}>
                      {factor}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
          <span>{p.agreeingClusters} agreeing / {p.conflictingClusters} conflicting</span>
          <span className={p.conflictingClusters > 0 ? "text-amber-400" : "text-green-400"}>
            {p.conflictingClusters === 0 ? "No conflicts" : `${p.conflictingClusters} conflict${p.conflictingClusters > 1 ? "s" : ""} reducing confidence`}
          </span>
        </div>
      </div>

      {/* Zone & Levels */}
      <SectionTitle>Zone & Levels</SectionTitle>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-lg bg-zinc-900/50 p-2">
          <div className="text-[10px] text-zinc-500 mb-0.5">Zone Upper</div>
          <div className="text-xs font-mono text-foreground">{formatPrice(p.predictedZone.upper)}</div>
        </div>
        <div className="rounded-lg bg-zinc-900/50 p-2">
          <div className="text-[10px] text-zinc-500 mb-0.5">Zone Lower</div>
          <div className="text-xs font-mono text-foreground">{formatPrice(p.predictedZone.lower)}</div>
        </div>
        <div className="rounded-lg bg-zinc-900/50 p-2">
          <div className="text-[10px] text-zinc-500 mb-0.5">L1</div>
          <div className="text-xs font-mono text-blue-400">{formatPrice(p.limitLevels.l1)}</div>
        </div>
        <div className="rounded-lg bg-zinc-900/50 p-2">
          <div className="text-[10px] text-zinc-500 mb-0.5">L2</div>
          <div className="text-xs font-mono text-blue-400">{formatPrice(p.limitLevels.l2)}</div>
        </div>
        <div className="rounded-lg bg-zinc-900/50 p-2">
          <div className="text-[10px] text-zinc-500 mb-0.5">L3</div>
          <div className="text-xs font-mono text-blue-400">{formatPrice(p.limitLevels.l3)}</div>
        </div>
        <div className="rounded-lg bg-zinc-900/50 p-2">
          <div className="text-[10px] text-zinc-500 mb-0.5">Invalidation</div>
          <div className="text-xs font-mono text-red-400">{formatPrice(p.invalidation)}</div>
        </div>
      </div>

      {/* Move & Distance */}
      <SectionTitle>Move & Distance</SectionTitle>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-lg bg-zinc-900/50 p-2 text-center">
          <div className="text-[10px] text-zinc-500 mb-0.5">Move</div>
          <div className={`text-sm font-mono font-bold ${p.movePercent > 0 ? "text-green-400" : "text-red-400"}`}>
            {p.movePercent > 0 ? "+" : ""}{p.movePercent.toFixed(1)}%
          </div>
        </div>
        <div className="rounded-lg bg-zinc-900/50 p-2 text-center">
          <div className="text-[10px] text-zinc-500 mb-0.5">To Zone</div>
          <div className="text-sm font-mono font-bold text-blue-400">
            {p.distanceToZonePct.toFixed(1)}%
          </div>
        </div>
        <div className="rounded-lg bg-zinc-900/50 p-2 text-center">
          <div className="text-[10px] text-zinc-500 mb-0.5">Approach</div>
          <div className={`text-[10px] font-bold ${
            p.approachState === "TOUCHING" ? "text-purple-400" :
            p.approachState === "NEAR" ? "text-amber-400" :
            p.approachState === "APPROACHING" ? "text-blue-400" :
            "text-zinc-500"
          }`}>
            {p.approachState}
          </div>
        </div>
      </div>

      {/* Key Indicators */}
      <SectionTitle>Key Indicators</SectionTitle>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-3 text-[11px]">
        <div className="flex justify-between">
          <span className="text-zinc-500">RSI</span>
          <span className={`font-mono ${f.momentum.rsi > 70 ? "text-red-400" : f.momentum.rsi < 30 ? "text-green-400" : "text-zinc-400"}`}>
            {f.momentum.rsi.toFixed(1)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">ATR Norm</span>
          <span className="font-mono text-zinc-400">{f.volatility.atrNormalized.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">ATR Expand</span>
          <span className={`font-mono ${f.volatility.atrExpansion > 1.5 ? "text-amber-400" : "text-zinc-400"}`}>
            {f.volatility.atrExpansion.toFixed(1)}x
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Vol Z-Score</span>
          <span className={`font-mono ${Math.abs(f.volume.volumeZScore) > 2 ? "text-amber-400" : "text-zinc-400"}`}>
            {f.volume.volumeZScore.toFixed(1)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">VWAP Dist</span>
          <span className={`font-mono ${Math.abs(f.vwap.distanceFromVwap) > 3 ? "text-amber-400" : "text-zinc-400"}`}>
            {f.vwap.distanceFromVwap.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">ROC 5m</span>
          <span className={`font-mono ${f.momentum.rateOfChange > 0 ? "text-green-400" : "text-red-400"}`}>
            {f.momentum.rateOfChange.toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Ext 1h</span>
          <span className={`font-mono ${Math.abs(f.priceExtension.ret1h) > 5 ? "text-amber-400" : "text-zinc-400"}`}>
            {f.priceExtension.ret1h > 0 ? "+" : ""}{f.priceExtension.ret1h.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Move/ATR</span>
          <span className={`font-mono ${f.volatility.moveOverATR > 2 ? "text-amber-400" : "text-zinc-400"}`}>
            {f.volatility.moveOverATR.toFixed(1)}
          </span>
        </div>
        {f.orderFlow.available && (
          <>
            <div className="flex justify-between">
              <span className="text-zinc-500">OFI Delta</span>
              <span className={`font-mono ${f.orderFlow.delta > 0 ? "text-green-400" : "text-red-400"}`}>
                {f.orderFlow.delta.toFixed(3)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">OF Weakening</span>
              <span className={`font-mono ${f.orderFlow.weakeningAggression ? "text-amber-400" : "text-zinc-400"}`}>
                {f.orderFlow.weakeningAggression ? "Yes" : "No"}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Supporting & Warning Factors */}
      <FactorList
        title="Supporting Factors"
        factors={p.supportingFactors}
        color="text-green-400"
      />
      <FactorList
        title="Warning Factors"
        factors={p.warningFactors}
        color="text-amber-400"
      />

      {/* Footer info */}
      <div className="mt-4 pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between text-[10px] text-zinc-500">
        <span>Source: {p.exchangeSource}</span>
        <span>State: {p.state.replace(/_/g, " ")}</span>
      </div>
    </div>
  );
}
