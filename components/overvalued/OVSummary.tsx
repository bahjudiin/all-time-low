"use client";

import type { OvervaluedUndervaluedResult } from "@/lib/overvaluedUndervalued";

interface OVSummaryProps {
  results: OvervaluedUndervaluedResult[];
}

export function OVSummary({ results }: OVSummaryProps) {
  const total = results.length;
  const overvalued = results.filter((r) => r.direction === "overvalued").length;
  const undervalued = results.filter((r) => r.direction === "undervalued").length;
  const extreme = results.filter((r) => (r.direction === "overvalued" ? r.overvaluationScore : r.undervaluationScore) >= 85).length;
  const entryNear = results.filter((r) => r.signalState === "ENTRY_NEAR" || r.signalState === "ENTRY_TOUCHED").length;
  const best = results.length > 0 ? results.reduce((a, b) => (b.opportunityScore > a.opportunityScore ? b : a)) : null;
  const avgConfidence = total > 0 ? Math.round(results.reduce((a, b) => a + b.finalConfidence, 0) / total) : 0;

  const cards = [
    { label: "Overvalued", value: overvalued, color: "text-red-400", sub: `${total} scanned` },
    { label: "Undervalued", value: undervalued, color: "text-emerald-400", sub: `${total} scanned` },
    { label: "Extreme", value: extreme, color: "text-amber-400", sub: "≥85 valuation" },
    { label: "Entry Near", value: entryNear, color: "text-blue-400", sub: "approaching zone" },
    { label: "Best Opp", value: best ? best.opportunityScore : 0, color: "text-purple-400", sub: best ? `${best.symbol}` : "—" },
    { label: "Avg Conf", value: avgConfidence, color: "text-zinc-300", sub: `${total} signals` },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 px-6 py-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{c.label}</div>
          <div className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</div>
          <div className="text-[10px] text-zinc-600 mt-0.5">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}