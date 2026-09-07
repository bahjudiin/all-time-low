"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
import type { OvervaluedUndervaluedResult } from "@/lib/overvaluedUndervalued";
import { OVTable } from "./OVTable";
import { OVSummary } from "./OVSummary";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type FilterKey = "all" | "overvalued" | "undervalued" | "extreme" | "entry-near" | "high-conf";

export function OvervaluedUndervaluedClient({
  onSelect,
  controlledFilter,
}: {
  onSelect?: (symbol: string, result: OvervaluedUndervaluedResult) => void;
  controlledFilter?: FilterKey;
}) {
  const { data: results, isLoading, error, mutate } = useSWR<OvervaluedUndervaluedResult[]>(
    "/api/overvalued-undervalued",
    fetcher,
    { refreshInterval: 60_000, revalidateOnFocus: true }
  );

  const [filter, setFilter] = useState<FilterKey>(controlledFilter ?? "all");
  const [minValuation, setMinValuation] = useState(0);
  const [minReversal, setMinReversal] = useState(0);

  const [lastControlled, setLastControlled] = useState(controlledFilter);
  if (controlledFilter !== lastControlled) {
    setLastControlled(controlledFilter);
    if (controlledFilter) setFilter(controlledFilter);
  }

  const filtered = useMemo(() => {
    if (!results) return [];
    let r = [...results];

    switch (filter) {
      case "overvalued": r = r.filter((x) => x.direction === "overvalued"); break;
      case "undervalued": r = r.filter((x) => x.direction === "undervalued"); break;
      case "extreme": r = r.filter((x) => (x.direction === "overvalued" ? x.overvaluationScore : x.undervaluationScore) >= 85); break;
      case "entry-near": r = r.filter((x) => x.signalState === "ENTRY_NEAR" || x.signalState === "ENTRY_TOUCHED" || x.signalState === "WAITING_FOR_ENTRY"); break;
      case "high-conf": r = r.filter((x) => x.finalConfidence >= 70); break;
    }

    if (minValuation > 0) r = r.filter((x) => (x.direction === "overvalued" ? x.overvaluationScore : x.undervaluationScore) >= minValuation);
    if (minReversal > 0) r = r.filter((x) => x.reversalProbability >= minReversal);

    r.sort((a, b) => b.opportunityScore - a.opportunityScore || b.finalConfidence - a.finalConfidence);
    return r;
  }, [results, filter, minValuation, minReversal]);

  const filterBtn = (key: FilterKey, label: string) => (
    <button
      key={key}
      onClick={() => setFilter(key)}
      className="mono"
      style={{
        padding: "4px 10px",
        fontSize: 11,
        fontWeight: 600,
        border: "1px solid var(--hair)",
        borderRadius: 2,
        background: filter === key ? "var(--amber)" : "var(--panel)",
        color: filter === key ? "var(--ink)" : "var(--muted)",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="flex-1" style={{ display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
      <OVSummary results={results || []} loading={isLoading} />

      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 3 }}>
          {filterBtn("all", "All")}
          {filterBtn("overvalued", "Overvalued")}
          {filterBtn("undervalued", "Undervalued")}
          {filterBtn("extreme", "Extreme")}
          {filterBtn("entry-near", "Entry Near")}
          {filterBtn("high-conf", "High Conf")}
        </div>
        <div style={{ width: 1, height: 20, background: "var(--hair)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <span style={{ color: "var(--muted2)", fontSize: 11 }}>Val</span>
          {[0, 60, 70, 80, 90].map((v) => (
            <button
              key={v}
              onClick={() => setMinValuation(v)}
              className="mono"
              style={{
                padding: "3px 8px",
                fontSize: 10,
                border: "1px solid var(--hair)",
                borderRadius: 2,
                background: minValuation === v ? "var(--amber)" : "var(--panel)",
                color: minValuation === v ? "var(--ink)" : "var(--muted2)",
                cursor: "pointer",
              }}
            >
              {v === 0 ? "Any" : `${v}+`}
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 20, background: "var(--hair)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <span style={{ color: "var(--muted2)", fontSize: 11 }}>Rev</span>
          {[0, 60, 70, 80].map((v) => (
            <button
              key={v}
              onClick={() => setMinReversal(v)}
              className="mono"
              style={{
                padding: "3px 8px",
                fontSize: 10,
                border: "1px solid var(--hair)",
                borderRadius: 2,
                background: minReversal === v ? "var(--amber)" : "var(--panel)",
                color: minReversal === v ? "var(--ink)" : "var(--muted2)",
                cursor: "pointer",
              }}
            >
              {v === 0 ? "Any" : `${v}+`}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1" style={{ minHeight: 0, overflow: "auto" }}>
        {isLoading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "60px 24px" }}>
            <div style={{ width: 24, height: 24, border: "2px solid var(--amber)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <p style={{ color: "var(--muted)", fontSize: 12 }}>Scanning futures for stretched coins...</p>
          </div>
        )}
        {error && !results && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "60px 24px" }}>
            <p style={{ color: "var(--muted)", fontSize: 12 }}>Failed to load market analysis</p>
            <button onClick={() => mutate()} className="mono" style={{ padding: "5px 14px", fontSize: 11, border: "1px solid var(--amber)", borderRadius: 2, background: "var(--amber)", color: "var(--ink)", cursor: "pointer" }}>
              Retry
            </button>
          </div>
        )}
        {!isLoading && !error && filtered.length > 0 && (
          <OVTable results={filtered} onRowClick={(r) => onSelect?.(r.symbol, r)} />
        )}
      </div>

      <div style={{ padding: "6px 14px", borderTop: "1px solid var(--hair)", textAlign: "center" }}>
        <p style={{ color: "var(--muted2)", fontSize: 10 }}>
          Statistical fair-value analysis only — predicted entries and reversion targets are estimates, not guarantees. Not financial advice.
        </p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
