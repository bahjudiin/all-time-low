"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { OvervaluedUndervaluedResult } from "@/lib/overvaluedUndervalued";

interface OVTableProps {
  results: OvervaluedUndervaluedResult[];
}

type SortKey = "opportunityScore" | "overvaluationScore" | "undervaluationScore" | "reversalProbability" | "continuationProbability" | "finalConfidence" | "currentPrice" | "predictedEntry" | "distanceToEntryPct" | "expectedRewardRisk" | "dataQuality" | "priceChange24hPct";

export function OVTable({ results }: OVTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("opportunityScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const arr = [...results];
    arr.sort((a, b) => {
      const aVal = a[sortKey] as number | undefined ?? 0;
      const bVal = b[sortKey] as number | undefined ?? 0;
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    });
    return arr;
  }, [results, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(sortDir === "desc" ? "asc" : "desc");
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortArrow = (key: SortKey) => key === sortKey ? (sortDir === "desc" ? " ↓" : " ↑") : "";

  const typeColor = (r: OvervaluedUndervaluedResult) =>
    r.direction === "overvalued" ? "text-red-400" : r.direction === "undervalued" ? "text-emerald-400" : "text-zinc-400";

  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-900 z-10">
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            <th className="px-3 py-2 text-left font-medium text-zinc-500 whitespace-nowrap">Coin</th>
            <Th onClick={() => toggleSort("currentPrice")} active={sortKey === "currentPrice"}>{`Price${sortArrow("currentPrice")}`}</Th>
            <th className="px-3 py-2 text-left font-medium text-zinc-500">Type</th>
            <Th onClick={() => toggleSort("opportunityScore")} active={sortKey === "opportunityScore"}>{`Opp${sortArrow("opportunityScore")}`}</Th>
            <Th onClick={() => toggleSort("overvaluationScore")} active={sortKey === "overvaluationScore"}>{`Oval${sortArrow("overvaluationScore")}`}</Th>
            <Th onClick={() => toggleSort("undervaluationScore")} active={sortKey === "undervaluationScore"}>{`Uval${sortArrow("undervaluationScore")}`}</Th>
            <Th onClick={() => toggleSort("reversalProbability")} active={sortKey === "reversalProbability"}>{`Rev${sortArrow("reversalProbability")}`}</Th>
            <Th onClick={() => toggleSort("continuationProbability")} active={sortKey === "continuationProbability"}>{`Cont${sortArrow("continuationProbability")}`}</Th>
            <Th onClick={() => toggleSort("finalConfidence")} active={sortKey === "finalConfidence"}>{`Conf${sortArrow("finalConfidence")}`}</Th>
            <Th onClick={() => toggleSort("predictedEntry")} active={sortKey === "predictedEntry"}>{`Entry${sortArrow("predictedEntry")}`}</Th>
            <Th onClick={() => toggleSort("distanceToEntryPct")} active={sortKey === "distanceToEntryPct"}>{`Dist${sortArrow("distanceToEntryPct")}`}</Th>
            <th className="px-3 py-2 text-left font-medium text-zinc-500">VWAP Δ</th>
            <th className="px-3 py-2 text-left font-medium text-zinc-500">RSI 1H</th>
            <th className="px-3 py-2 text-left font-medium text-zinc-500">Funding</th>
            <th className="px-3 py-2 text-left font-medium text-zinc-500">OI</th>
            <Th onClick={() => toggleSort("expectedRewardRisk")} active={sortKey === "expectedRewardRisk"}>{`R:R${sortArrow("expectedRewardRisk")}`}</Th>
            <th className="px-3 py-2 text-left font-medium text-zinc-500">Regime</th>
            <th className="px-3 py-2 text-left font-medium text-zinc-500">State</th>
            <Th onClick={() => toggleSort("priceChange24hPct")} active={sortKey === "priceChange24hPct"}>{`24h${sortArrow("priceChange24hPct")}`}</Th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.symbol} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <img src={r.image} alt="" className="w-5 h-5 rounded-full" loading="lazy" />
                  <div>
                    <div className="font-medium text-zinc-100">{r.name}</div>
                    <div className="text-[10px] text-zinc-500 uppercase">{r.symbol}</div>
                  </div>
                </div>
              </td>
              <td className="px-3 py-2 font-mono text-zinc-300">${fmtPrice(r.currentPrice)}</td>
              <td className={`px-3 py-2 font-medium ${typeColor(r)}`}>
                {r.direction === "overvalued" ? "SHORT" : r.direction === "undervalued" ? "LONG" : "—"}
              </td>
              <td className="px-3 py-2 font-mono font-bold text-zinc-100">{Math.round(r.opportunityScore)}</td>
              <td className="px-3 py-2 font-mono text-red-400">{Math.round(r.overvaluationScore)}</td>
              <td className="px-3 py-2 font-mono text-emerald-400">{Math.round(r.undervaluationScore)}</td>
              <td className="px-3 py-2 font-mono text-zinc-300">{Math.round(r.reversalProbability)}</td>
              <td className="px-3 py-2 font-mono text-zinc-400">{Math.round(r.continuationProbability)}</td>
              <td className="px-3 py-2 font-mono text-zinc-300">{Math.round(r.finalConfidence)}</td>
              <td className="px-3 py-2 font-mono text-amber-300">${fmtPrice(r.predictedEntry)}</td>
              <td className={`px-3 py-2 font-mono ${r.distanceToEntryPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {r.distanceToEntryPct > 0 ? "+" : ""}{r.distanceToEntryPct.toFixed(2)}%
              </td>
              <td className={`px-3 py-2 font-mono ${r.factors.fairValue.combinedDeviation > 0 ? "text-red-400" : "text-emerald-400"}`}>
                {r.factors.fairValue.combinedDeviation > 0 ? "+" : ""}{r.factors.fairValue.combinedDeviation}%
              </td>
              <td className="px-3 py-2 font-mono text-zinc-300">{r.factors.momentum.rsi1h}</td>
              <td className={`px-3 py-2 font-mono ${r.factors.crowding.fundingRate > 0 ? "text-red-400" : r.factors.crowding.fundingRate < 0 ? "text-emerald-400" : "text-zinc-400"}`}>
                {r.factors.crowding.fundingRate > 0 ? "+" : ""}{r.factors.crowding.fundingRate}%
              </td>
              <td className="px-3 py-2 font-mono text-zinc-400">{r.factors.crowding.oiChange1hPct > 0 ? "+" : ""}{r.factors.crowding.oiChange1hPct}%</td>
              <td className={`px-3 py-2 font-mono ${r.expectedRewardRisk >= 2 ? "text-emerald-400" : r.expectedRewardRisk >= 1.5 ? "text-amber-400" : "text-red-400"}`}>
                {r.expectedRewardRisk.toFixed(1)}
              </td>
              <td className="px-3 py-2 text-zinc-400 whitespace-nowrap">{r.marketRegime}</td>
              <td className="px-3 py-2 whitespace-nowrap">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  {r.signalState.replace(/_/g, " ")}
                </span>
              </td>
              <td className={`px-3 py-2 font-mono ${r.priceChange24hPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {r.priceChange24hPct > 0 ? "+" : ""}{r.priceChange24hPct.toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, onClick, active }: { children: ReactNode; onClick: () => void; active: boolean }) {
  return (
    <th
      onClick={onClick}
      className={`px-3 py-2 text-left font-medium whitespace-nowrap cursor-pointer select-none transition-colors ${
        active ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300"
      }`}
    >
      {children}
    </th>
  );
}

function fmtPrice(n: number): string {
  if (n >= 100) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (n >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}