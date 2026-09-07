"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { OvervaluedUndervaluedResult } from "@/lib/overvaluedUndervalued";

interface OVTableProps {
  results: OvervaluedUndervaluedResult[];
  onRowClick?: (result: OvervaluedUndervaluedResult) => void;
}

type SortKey = "opportunityScore" | "overvaluationScore" | "undervaluationScore" | "reversalProbability" | "continuationProbability" | "finalConfidence" | "currentPrice" | "predictedEntry" | "distanceToEntryPct" | "expectedRewardRisk" | "dataQuality" | "priceChange24hPct";

const HIDE_SM = "hidden sm:table-cell";
const HIDE_MD = "hidden md:table-cell";
const HIDE_LG = "hidden lg:table-cell";

export function OVTable({ results, onRowClick }: OVTableProps) {
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

  return (
    <div className="overflow-auto h-full">
      <table className="w-full mono" style={{ fontSize: 11 }}>
        <thead className="sticky top-0" style={{ background: "var(--panel-raised)", borderBottom: "1px solid var(--hair)" }}>
          <tr>
            <Th>COIN</Th>
            <Th dir={sortDir} onClick={() => toggleSort("currentPrice")} active={sortKey === "currentPrice"}>{`PRICE${sortArrow("currentPrice")}`}</Th>
            <Th>DIR</Th>
            <Th dir={sortDir} onClick={() => toggleSort("opportunityScore")} active={sortKey === "opportunityScore"}>{`OPP${sortArrow("opportunityScore")}`}</Th>
            <Th hide={HIDE_SM} dir={sortDir} onClick={() => toggleSort("overvaluationScore")} active={sortKey === "overvaluationScore"}>{`OVAL${sortArrow("overvaluationScore")}`}</Th>
            <Th hide={HIDE_SM} dir={sortDir} onClick={() => toggleSort("undervaluationScore")} active={sortKey === "undervaluationScore"}>{`UVAL${sortArrow("undervaluationScore")}`}</Th>
            <Th hide={HIDE_SM} dir={sortDir} onClick={() => toggleSort("reversalProbability")} active={sortKey === "reversalProbability"}>{`REV${sortArrow("reversalProbability")}`}</Th>
            <Th hide={HIDE_MD} dir={sortDir} onClick={() => toggleSort("continuationProbability")} active={sortKey === "continuationProbability"}>{`CONT${sortArrow("continuationProbability")}`}</Th>
            <Th hide={HIDE_SM} dir={sortDir} onClick={() => toggleSort("finalConfidence")} active={sortKey === "finalConfidence"}>{`CONF${sortArrow("finalConfidence")}`}</Th>
            <Th dir={sortDir} onClick={() => toggleSort("predictedEntry")} active={sortKey === "predictedEntry"}>{`ENTRY${sortArrow("predictedEntry")}`}</Th>
            <Th dir={sortDir} onClick={() => toggleSort("distanceToEntryPct")} active={sortKey === "distanceToEntryPct"}>{`DIST${sortArrow("distanceToEntryPct")}`}</Th>
            <Th hide={HIDE_MD}>VWAP</Th>
            <Th hide={HIDE_MD}>RSI</Th>
            <Th hide={HIDE_LG}>FUND</Th>
            <Th hide={HIDE_LG}>OI</Th>
            <Th dir={sortDir} onClick={() => toggleSort("expectedRewardRisk")} active={sortKey === "expectedRewardRisk"}>{`R:R${sortArrow("expectedRewardRisk")}`}</Th>
            <Th hide={HIDE_SM}>REGIME</Th>
            <Th hide={HIDE_SM}>STATE</Th>
            <Th dir={sortDir} onClick={() => toggleSort("priceChange24hPct")} active={sortKey === "priceChange24hPct"}>{`24H${sortArrow("priceChange24hPct")}`}</Th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr
              key={r.symbol}
              tabIndex={0}
              role="button"
              aria-label={`Open ${r.name}`}
              onClick={() => onRowClick?.(r)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRowClick?.(r); } }}
              style={{ borderBottom: "1px solid var(--hair)", cursor: onRowClick ? "pointer" : undefined }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--panel-raised)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
            >
              <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <img src={r.image} alt="" style={{ width: 18, height: 18, borderRadius: "50%" }} loading="lazy" />
                  <div>
                    <div title={r.name} style={{ fontWeight: 600, fontSize: 11, color: "var(--ink-primary)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                    <div style={{ fontSize: 9, color: "var(--muted2)", textTransform: "uppercase" }}>{r.symbol}</div>
                  </div>
                </div>
              </td>
              <td className="mono" style={{ padding: "8px 10px", color: "var(--ink-secondary)" }}>${fmtPrice(r.currentPrice)}</td>
              <td style={{ padding: "8px 10px", fontWeight: 600, color: r.direction === "overvalued" ? "var(--short)" : r.direction === "undervalued" ? "var(--long)" : "var(--ink-secondary)" }}>
                {r.direction === "overvalued" ? "SHORT" : r.direction === "undervalued" ? "LONG" : "—"}
              </td>
              <td className="mono" style={{ padding: "8px 10px", fontWeight: 700, color: "var(--ink-primary)" }}>{Math.round(r.opportunityScore)}</td>
              <td className={`mono ${HIDE_SM}`} style={{ padding: "8px 10px", color: "var(--short)" }}>{Math.round(r.overvaluationScore)}</td>
              <td className={`mono ${HIDE_SM}`} style={{ padding: "8px 10px", color: "var(--long)" }}>{Math.round(r.undervaluationScore)}</td>
              <td className={`mono ${HIDE_SM}`} style={{ padding: "8px 10px", color: "var(--ink-secondary)" }}>{Math.round(r.reversalProbability)}</td>
              <td className={`mono ${HIDE_MD}`} style={{ padding: "8px 10px", color: "var(--ink-secondary)" }}>{Math.round(r.continuationProbability)}</td>
              <td className={`mono ${HIDE_SM}`} style={{ padding: "8px 10px", color: "var(--ink-secondary)" }}>{Math.round(r.finalConfidence)}</td>
              <td className="mono" style={{ padding: "8px 10px", color: "var(--amber)" }}>${fmtPrice(r.predictedEntry)}</td>
              <td className="mono" style={{ padding: "8px 10px", color: r.distanceToEntryPct >= 0 ? "var(--long)" : "var(--short)" }}>
                {r.distanceToEntryPct > 0 ? "+" : ""}{r.distanceToEntryPct.toFixed(2)}%
              </td>
              <td className={`mono ${HIDE_MD}`} style={{ padding: "8px 10px", color: r.factors.fairValue.combinedDeviation > 0 ? "var(--short)" : "var(--long)" }}>
                {r.factors.fairValue.combinedDeviation > 0 ? "+" : ""}{r.factors.fairValue.combinedDeviation}%
              </td>
              <td className={`mono ${HIDE_MD}`} style={{ padding: "8px 10px", color: "var(--ink-secondary)" }}>{r.factors.momentum.rsi1h}</td>
              <td className={`mono ${HIDE_LG}`} style={{ padding: "8px 10px", color: r.factors.crowding.fundingRate > 0 ? "var(--short)" : r.factors.crowding.fundingRate < 0 ? "var(--long)" : "var(--ink-secondary)" }}>
                {r.factors.crowding.fundingRate > 0 ? "+" : ""}{r.factors.crowding.fundingRate}%
              </td>
              <td className={`mono ${HIDE_LG}`} style={{ padding: "8px 10px", color: "var(--ink-secondary)" }}>{r.factors.crowding.oiChange1hPct > 0 ? "+" : ""}{r.factors.crowding.oiChange1hPct}%</td>
              <td className="mono" style={{ padding: "8px 10px", color: r.expectedRewardRisk >= 2 ? "var(--long)" : r.expectedRewardRisk >= 1.5 ? "var(--amber)" : "var(--short)" }}>
                {r.expectedRewardRisk.toFixed(1)}
              </td>
              <td className={HIDE_SM} style={{ padding: "8px 10px", color: "var(--ink-secondary)", whiteSpace: "nowrap" }}>{r.marketRegime}</td>
              <td className={HIDE_SM} style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                <span className="mono" style={{ fontSize: 9, padding: "2px 6px", background: "var(--panel-raised)", border: "1px solid var(--hair)", borderRadius: 2 }}>
                  {r.signalState.replace(/_/g, " ")}
                </span>
              </td>
              <td className="mono" style={{ padding: "8px 10px", color: r.priceChange24hPct >= 0 ? "var(--long)" : "var(--short)" }}>
                {r.priceChange24hPct > 0 ? "+" : ""}{r.priceChange24hPct.toFixed(2)}%
              </td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr><td colSpan={8} style={{ padding: "40px 0", textAlign: "center", fontSize: 11, color: "var(--muted2)" }}>No coins match your filters</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, onClick, active, hide = "", dir }: { children: ReactNode; onClick?: () => void; active?: boolean; hide?: string; dir?: "asc" | "desc" }) {
  const style: React.CSSProperties = { padding: "8px 10px", textAlign: "left", fontWeight: 500, whiteSpace: "nowrap" };
  if (onClick) { style.cursor = "pointer"; }
  return (
    <th className={`${hide}`} style={style} aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : undefined}>
      <button
        type="button"
        onClick={onClick}
        className="mono"
        style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: active ? "var(--amber)" : "var(--muted2)", background: "none", border: "none", padding: 0, cursor: onClick ? "pointer" : undefined }}
      >
        {children}
      </button>
    </th>
  );
}

function fmtPrice(n: number): string {
  if (n >= 100) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (n >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}
