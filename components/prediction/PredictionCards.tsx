"use client";

import type { CoinPrediction } from "@/types/prediction";

interface PredictionCardsProps {
  predictions: CoinPrediction[];
  onSelect: (symbol: string | null) => void;
  selectedSymbol: string | null;
}

function formatPrice(n: number): string {
  if (n >= 1000) return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(6)}`;
}

function ScoreGauge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-500">{label}</span>
        <span className="text-[10px] font-mono text-zinc-400">{value}%</span>
      </div>
      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ClusterRow({ vote }: { vote: CoinPrediction["clusterVotes"][0] }) {
  const isAgreeing = vote.vote !== 0;
  const isConflicting = vote.vote !== 0;
  return (
    <div className="flex items-center justify-between text-[10px]">
      <span className="text-zinc-500">{vote.name}</span>
      <div className="flex items-center gap-1.5">
        <div className="w-8 h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${
              vote.vote === 0 ? "bg-zinc-600" : "bg-blue-500"
            }`}
            style={{ width: `${vote.confidence}%` }}
          />
        </div>
        <span className={`font-mono ${
          vote.vote === 0 ? "text-zinc-600" : "text-blue-400"
        }`}>
          {vote.vote === 0 ? "—" : vote.vote === 1 ? "↑" : "↓"}
        </span>
      </div>
    </div>
  );
}

export function PredictionCards({ predictions, onSelect, selectedSymbol }: PredictionCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4 overflow-auto">
      {predictions.map((p) => {
        const isSelected = selectedSymbol === p.symbol;
        const f = p.factors;

        return (
          <div
            key={p.symbol}
            onClick={() => onSelect(isSelected ? null : p.symbol)}
            className={`rounded-lg border p-3 cursor-pointer transition-all ${
              isSelected
                ? "border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/20"
                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <img src={p.image} alt={p.name} className="w-6 h-6 rounded-full" loading="lazy" />
                <div>
                  <div className="text-sm font-bold">{p.symbol}</div>
                  <div className="text-[10px] text-zinc-500">{p.name}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                  p.direction === "SHORT" ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                }`}>
                  {p.direction}
                </span>
                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                  p.quality === "A+" ? "bg-amber-500/20 text-amber-400" :
                  p.quality === "A" ? "bg-green-500/20 text-green-400" :
                  p.quality === "B" ? "bg-blue-500/20 text-blue-400" :
                  "bg-zinc-500/20 text-zinc-400"
                }`}>
                  {p.quality}
                </span>
              </div>
            </div>

            {/* Price & Move */}
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-sm font-mono font-bold">{formatPrice(p.currentPrice)}</span>
              <span className={`text-xs font-mono ${p.movePercent > 0 ? "text-green-400" : "text-red-400"}`}>
                {p.movePercent > 0 ? "+" : ""}{p.movePercent.toFixed(1)}%
              </span>
            </div>

            {/* State & Approach */}
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] font-medium uppercase ${
                p.state === "extreme" || p.state === "exhaustion_building" ? "text-red-400" :
                p.state === "target_forming" || p.state === "limit_zone" ? "text-amber-400" :
                p.state === "touched" || p.state === "reversing" ? "text-purple-400" :
                "text-zinc-500"
              }`}>
                {p.state.replace(/_/g, " ")}
              </span>
              <span className={`px-1 py-0.5 text-[9px] font-medium rounded ${
                p.approachState === "TOUCHING" || p.approachState === "TOUCHED" ? "bg-purple-500/20 text-purple-400" :
                p.approachState === "NEAR" ? "bg-amber-500/20 text-amber-400" :
                p.approachState === "APPROACHING" ? "bg-blue-500/20 text-blue-400" :
                "bg-zinc-500/10 text-zinc-500"
              }`}>
                {p.approachState}
              </span>
            </div>

            {/* Zone */}
            <div className="bg-zinc-900/50 rounded-md p-2 mb-2">
              <div className="text-[10px] text-zinc-500 mb-1">Predicted Zone</div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className={p.direction === "SHORT" ? "text-red-400" : "text-green-400"}>
                  {formatPrice(p.predictedZone.lower)}
                </span>
                <span className="text-zinc-600">↔</span>
                <span className={p.direction === "SHORT" ? "text-red-400" : "text-green-400"}>
                  {formatPrice(p.predictedZone.upper)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1 text-[10px] text-zinc-500">
                <span>Dist: {p.distanceToZonePct.toFixed(1)}%</span>
                <span>Inval: {formatPrice(p.invalidation)}</span>
              </div>
            </div>

            {/* Score Gauges */}
            <div className="space-y-1.5 mb-2">
              <ScoreGauge
                label="Exhaustion"
                value={p.exhaustionProbability}
                color={p.exhaustionProbability >= 70 ? "bg-red-500" : p.exhaustionProbability >= 50 ? "bg-amber-500" : "bg-zinc-600"}
              />
              <ScoreGauge
                label="Continuation"
                value={p.continuationProbability}
                color={p.continuationProbability < 30 ? "bg-green-500" : "bg-zinc-600"}
              />
              <ScoreGauge
                label="Zone Reach"
                value={p.zoneReachProbability}
                color="bg-blue-500"
              />
            </div>

            {/* Cluster Votes */}
            <div className="bg-zinc-900/30 rounded-md p-2 mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-zinc-500">Clusters</span>
                <span className={`text-[10px] font-mono ${
                  p.agreeingClusters >= 4 ? "text-green-400" : p.agreeingClusters >= 2 ? "text-amber-400" : "text-zinc-500"
                }`}>
                  {p.agreeingClusters} agree / {p.conflictingClusters} conflict
                </span>
              </div>
              <div className="space-y-0.5">
                {p.clusterVotes.slice(0, 4).map((cv) => (
                  <ClusterRow key={cv.name} vote={cv} />
                ))}
              </div>
            </div>

            {/* Key Indicators Row */}
            <div className="grid grid-cols-4 gap-1 text-center">
              <div className="bg-zinc-900/30 rounded p-1">
                <div className="text-[9px] text-zinc-500">RSI</div>
                <div className={`text-[10px] font-mono ${f.momentum.rsi > 70 ? "text-red-400" : f.momentum.rsi < 30 ? "text-green-400" : "text-zinc-400"}`}>
                  {f.momentum.rsi.toFixed(0)}
                </div>
              </div>
              <div className="bg-zinc-900/30 rounded p-1">
                <div className="text-[9px] text-zinc-500">ATR</div>
                <div className={`text-[10px] font-mono ${f.volatility.atrExpansion > 1.5 ? "text-amber-400" : "text-zinc-400"}`}>
                  {f.volatility.atrExpansion.toFixed(1)}x
                </div>
              </div>
              <div className="bg-zinc-900/30 rounded p-1">
                <div className="text-[9px] text-zinc-500">Vol Z</div>
                <div className={`text-[10px] font-mono ${Math.abs(f.volume.volumeZScore) > 2 ? "text-amber-400" : "text-zinc-400"}`}>
                  {f.volume.volumeZScore.toFixed(1)}
                </div>
              </div>
              <div className="bg-zinc-900/30 rounded p-1">
                <div className="text-[9px] text-zinc-500">Ext</div>
                <div className={`text-[10px] font-mono ${Math.abs(f.priceExtension.ret1h) > 5 ? "text-amber-400" : "text-zinc-400"}`}>
                  {f.priceExtension.ret1h > 0 ? "+" : ""}{f.priceExtension.ret1h.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Supporting/Warning counts */}
            {(p.supportingFactors.length > 0 || p.warningFactors.length > 0) && (
              <div className="flex items-center gap-3 mt-2 text-[10px]">
                {p.supportingFactors.length > 0 && (
                  <span className="text-green-400">{p.supportingFactors.length} bullish</span>
                )}
                {p.warningFactors.length > 0 && (
                  <span className="text-amber-400">{p.warningFactors.length} bearish</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
