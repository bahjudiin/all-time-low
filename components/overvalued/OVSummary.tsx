"use client";

import type { OvervaluedUndervaluedResult } from "@/lib/overvaluedUndervalued";

interface OVSummaryProps {
  results: OvervaluedUndervaluedResult[];
  loading?: boolean;
}

export function OVSummary({ results, loading = false }: OVSummaryProps) {
  const total = results.length;
  const overvalued = results.filter((r) => r.direction === "overvalued").length;
  const undervalued = results.filter((r) => r.direction === "undervalued").length;
  const extreme = results.filter((r) => (r.direction === "overvalued" ? r.overvaluationScore : r.undervaluationScore) >= 85).length;
  const entryNear = results.filter((r) => r.signalState === "ENTRY_NEAR" || r.signalState === "ENTRY_TOUCHED").length;
  const best = results.length > 0 ? results.reduce((a, b) => (b.opportunityScore > a.opportunityScore ? b : a)) : null;
  const avgConfidence = total > 0 ? Math.round(results.reduce((a, b) => a + b.finalConfidence, 0) / total) : 0;

  const cards = [
    { label: "Overvalued", value: overvalued, color: "short", sub: `${total} scanned` },
    { label: "Undervalued", value: undervalued, color: "long", sub: `${total} scanned` },
    { label: "Extreme", value: extreme, color: "amber", sub: "≥85 valuation" },
    { label: "Entry Near", value: entryNear, color: "cyan", sub: "approaching zone" },
    { label: "Best Opp", value: best ? Math.round(best.opportunityScore) : 0, color: "violet", sub: best ? `${best.symbol}` : "—" },
    { label: "Avg Conf", value: avgConfidence, color: "", sub: `${total} signals` },
  ];

  return (
    <div className="breadth-row" style={{ marginBottom: 14 }}>
      {cards.map((c) => (
        <div key={c.label} className="breadth-cell">
          <div className="lbl">{c.label}</div>
          <div className={`val ${c.color}`}>{loading ? "…" : c.value}</div>
          <div style={{ color: "var(--muted2)", fontSize: 9, marginTop: 2 }}>{loading ? "fetching…" : c.sub}</div>
        </div>
      ))}
    </div>
  );
}
