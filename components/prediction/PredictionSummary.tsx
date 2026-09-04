"use client";

import { useMemo } from "react";
import type { CoinPrediction } from "@/types/prediction";

interface PredictionSummaryProps {
  predictions: CoinPrediction[];
}

export function PredictionSummary({ predictions }: PredictionSummaryProps) {
  const stats = useMemo(() => {
    const active = predictions.filter(
      (p) => p.state !== "normal" && p.state !== "complete" && p.state !== "cooldown"
    );
    const strong = predictions.filter(
      (p) => p.quality === "A+" || p.quality === "A"
    );
    const shortZones = predictions.filter((p) => p.direction === "SHORT");
    const longZones = predictions.filter((p) => p.direction === "LONG");
    const approaching = predictions.filter(
      (p) => p.approachState === "APPROACHING" || p.approachState === "NEAR"
    );
    const touching = predictions.filter(
      (p) => p.approachState === "TOUCHING" || p.state === "touched"
    );

    return {
      active: active.length,
      strong: strong.length,
      shortZones: shortZones.length,
      longZones: longZones.length,
      approaching: approaching.length,
      touching: touching.length,
    };
  }, [predictions]);

  return (
    <div className="grid grid-cols-6 gap-3 px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30">
      <div className="text-center">
        <div className="text-lg font-bold text-foreground">{stats.active}</div>
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Active</div>
      </div>
      <div className="text-center">
        <div className="text-lg font-bold text-amber-400">{stats.strong}</div>
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Strong Exhaustion</div>
      </div>
      <div className="text-center">
        <div className="text-lg font-bold text-red-400">{stats.shortZones}</div>
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">SHORT Zones</div>
      </div>
      <div className="text-center">
        <div className="text-lg font-bold text-green-400">{stats.longZones}</div>
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">LONG Zones</div>
      </div>
      <div className="text-center">
        <div className="text-lg font-bold text-blue-400">{stats.approaching}</div>
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Approaching</div>
      </div>
      <div className="text-center">
        <div className="text-lg font-bold text-purple-400">{stats.touching}</div>
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Touched</div>
      </div>
    </div>
  );
}
