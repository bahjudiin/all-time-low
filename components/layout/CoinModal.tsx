"use client";

import { X, Trophy, TrendingDown, Activity, Target, AlertTriangle, CheckCircle2, Calendar } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useNavStore } from "@/lib/navStore";
import type { CoinWithDerived } from "@/types/coin";
import type { CoinDetailExtra } from "@/types/nav";
import { formatUSD, formatCompact } from "@/lib/format";

export type { CoinDetailExtra };

type Section = "overview" | "valuation";

export function CoinModal({ coin, extra }: { coin: CoinWithDerived | null; extra?: CoinDetailExtra }) {
  const modalSymbol = useNavStore((s) => s.modalSymbol);
  const closeModal = useNavStore((s) => s.closeModal);
  const [section, setSection] = useState<Section>("overview");
  const [lastSymbol, setLastSymbol] = useState(modalSymbol);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const headingId = useStableId("coin-modal-heading");
  const descId = useStableId("coin-modal-desc");

  useEffect(() => {
    if (modalSymbol) previousFocusRef.current = document.activeElement as HTMLElement;
  }, [modalSymbol]);

  useEffect(() => {
    if (!modalSymbol) return;
    const dialog = dialogRef.current;
    if (dialog) {
      const closeBtn = dialog.querySelector<HTMLElement>("button[aria-label='Close']");
      (closeBtn ?? dialog).focus();
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { closeModal(); return; }
      if (e.key === "Tab" && dialog) {
        const focusable = dialog.querySelectorAll<HTMLElement>("button:not([tabindex='-1']), [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
        else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
      }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previousFocusRef.current?.focus();
    };
  }, [modalSymbol, closeModal]);

  if (modalSymbol !== lastSymbol) { setLastSymbol(modalSymbol); setSection("overview"); }
  if (!modalSymbol || !coin) return null;

  return (
    <div ref={dialogRef} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby={headingId} aria-describedby={descId}>
      <button aria-label="Close" tabIndex={-1} onClick={closeModal} className="absolute inset-0 modal-backdrop cursor-default" />
      <div className="relative w-full sm:max-w-[740px] max-h-[92vh] flex flex-col animate-fade-in" style={{ background: "var(--panel)", border: "1px solid var(--hair)", borderRadius: "var(--radius-xs,6px)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--hair)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={coin.image} alt={coin.name} style={{ width: 32, height: 32, borderRadius: "50%" }} loading="lazy" />
            <div>
              <div id={headingId} style={{ fontWeight: 600, fontSize: 13 }}>{coin.name}</div>
              <div className="mono" style={{ color: "var(--muted2)", fontSize: 10, textTransform: "uppercase" }}>{coin.symbol}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="mono" style={{ fontSize: 20, fontWeight: 700 }}>${coin.current_price.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
            <button onClick={closeModal} aria-label="Close" style={{ padding: 6, background: "none", border: "none", color: "var(--muted)", cursor: "pointer", borderRadius: 2 }}>
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, padding: "8px 16px", borderBottom: "1px solid var(--hair)" }}>
          <SectionTab active={section === "overview"} onClick={() => setSection("overview")}>Overview</SectionTab>
          {!!extra?.overvalued && <SectionTab active={section === "valuation"} onClick={() => setSection("valuation")}>Valuation</SectionTab>}
        </div>

        <div id={descId} className="flex-1" style={{ overflow: "auto", padding: 16 }}>
          {section === "overview" && <OverviewSection coin={coin} extra={extra} />}
          {section === "valuation" && extra?.overvalued && <ValuationSection result={extra.overvalued} coin={coin} />}
        </div>
      </div>
    </div>
  );
}

function useStableId(prefix: string) { const id = useId(); return `${prefix}-${id}`; }

function SectionTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button role="tab" aria-selected={active} onClick={onClick} className="mono" style={{ padding: "4px 10px", fontSize: 11, fontWeight: 600, border: "none", borderBottom: active ? "2px solid var(--amber)" : "2px solid transparent", background: "none", color: active ? "var(--amber)" : "var(--muted2)", cursor: "pointer", whiteSpace: "nowrap" }}>
      {children}
    </button>
  );
}

function OverviewSection({ coin, extra }: { coin: CoinWithDerived; extra?: CoinDetailExtra }) {
  const isUp = coin.price_change_percentage_24h >= 0;
  const volMcRatio = coin.total_volume > 0 && coin.market_cap > 0 ? (coin.total_volume / coin.market_cap) * 100 : 0;
  const supplyPct = coin.circulating_supply > 0 && coin.max_supply ? (coin.circulating_supply / coin.max_supply) * 100 : 0;
  const rangeLow = coin.low_24h;
  const rangeHigh = coin.high_24h;
  const rangePct = rangeHigh > rangeLow ? ((coin.current_price - rangeLow) / (rangeHigh - rangeLow)) * 100 : 50;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: isUp ? "var(--long)" : "var(--short)" }}>
          {isUp ? "+" : ""}{coin.price_change_percentage_24h.toFixed(2)}%
        </span>
        <span className="mono" style={{ fontSize: 11, color: "var(--muted2)" }}>
          {formatUSD(coin.price_change_24h)} today
        </span>
        <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--muted2)" }} className="mono">
          Rank #{coin.market_cap_rank ?? "—"}
        </span>
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--muted2)", marginBottom: 3 }} className="mono">
          <span>{formatUSD(rangeLow)}</span><span>24H Range</span><span>{formatUSD(rangeHigh)}</span>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: "var(--hair)", position: "relative", overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 2, background: isUp ? "var(--long)" : "var(--short)", width: `${rangePct}%` }} />
          <div style={{ position: "absolute", left: `${rangePct}%`, top: -2, width: 2, height: 8, background: "var(--text)", borderRadius: 1, transform: "translateX(-1px)" }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <StatTile icon={<Trophy style={{ width: 12, height: 12, color: "var(--amber)" }} />} label="ATH" value={`$${coin.ath.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} sub={`${coin.ath_change_percentage.toFixed(2)}% from now`} />
        <StatTile icon={<TrendingDown style={{ width: 12, height: 12, color: "var(--long)" }} />} label="ATL" value={`$${coin.atl.toLocaleString(undefined, { maximumFractionDigits: 6 })}`} sub={`+${coin.atl_change_percentage.toFixed(2)}% from now`} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
        <StatMini label="MCap" value={formatCompact(coin.market_cap)} />
        <StatMini label="Vol 24h" value={formatCompact(coin.total_volume)} />
        <StatMini label="MCap Δ24h" value={`${coin.market_cap_change_percentage_24h >= 0 ? "+" : ""}${coin.market_cap_change_percentage_24h.toFixed(1)}%`} />
        <StatMini label="Vol/MCap" value={volMcRatio.toFixed(1) + "%"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
        <StatMini label="Circ Supply" value={formatCompact(coin.circulating_supply)} />
        <StatMini label="Max Supply" value={coin.max_supply ? formatCompact(coin.max_supply) : "∞"} />
        <StatMini label="Total Supply" value={coin.total_supply ? formatCompact(coin.total_supply) : "—"} />
        <StatMini label="FDV" value={coin.fully_diluted_valuation ? formatCompact(coin.fully_diluted_valuation) : "—"} />
      </div>

      {coin.max_supply && coin.circulating_supply > 0 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--muted2)", marginBottom: 3 }} className="mono">
            <span>Circulating</span><span>{supplyPct.toFixed(1)}% of max</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: "var(--hair)" }}>
            <div style={{ height: "100%", borderRadius: 2, background: "var(--amber)", width: `${Math.min(supplyPct, 100)}%` }} />
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ background: "var(--panel-raised)", border: "1px solid var(--hair)", borderRadius: "var(--radius-xs,6px)", padding: "8px 10px" }}>
          <div style={{ fontSize: 9, color: "var(--muted2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}><Calendar style={{ width: 10, height: 10, display: "inline", marginRight: 3, verticalAlign: -1 }} />ATH Date</div>
          <div className="mono" style={{ fontSize: 11, fontWeight: 500 }}>{coin.ath_date ? new Date(coin.ath_date).toLocaleDateString() : "—"}</div>
        </div>
        <div style={{ background: "var(--panel-raised)", border: "1px solid var(--hair)", borderRadius: "var(--radius-xs,6px)", padding: "8px 10px" }}>
          <div style={{ fontSize: 9, color: "var(--muted2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}><Calendar style={{ width: 10, height: 10, display: "inline", marginRight: 3, verticalAlign: -1 }} />ATL Date</div>
          <div className="mono" style={{ fontSize: 11, fontWeight: 500 }}>{coin.atl_date ? new Date(coin.atl_date).toLocaleDateString() : "—"}</div>
        </div>
      </div>

      {extra?.overvalued && <OvervaluedSummary result={extra.overvalued} />}
    </div>
  );
}

function ValuationSection({ result, coin }: { result: NonNullable<CoinDetailExtra["overvalued"]>; coin: CoinWithDerived }) {
  const isOver = result.direction === "overvalued";
  const F = result.factors;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: isOver ? "var(--short)" : "var(--long)" }}>{isOver ? "● SHORT SETUP" : "● LONG SETUP"}</span>
        <span className="mono" style={{ fontSize: 10, color: "var(--muted2)" }}>Opp {Math.round(result.opportunityScore)}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
        <StatMini label="State" value={result.signalState.replace(/_/g, " ")} />
        <StatMini label="Reversal" value={`${Math.round(result.reversalProbability)}%`} />
        <StatMini label="Conf" value={`${Math.round(result.finalConfidence)}%`} />
        <StatMini label="Regime" value={result.marketRegime} />
      </div>
      <div className="panel-box">
        <div className="ph" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Target style={{ width: 12, height: 12 }} /> Trade Plan</span>
          <span className="n">{result.symbol}</span>
        </div>
        <div className="planline"><span className="k">Entry Zone</span><span>{formatUSD(result.entryZoneLower)} – {formatUSD(result.entryZoneUpper)}</span></div>
        <div className="planline"><span className="k">Invalidation</span><span style={{ color: "var(--short)" }}>{formatUSD(result.invalidation)}</span></div>
        <div className="planline"><span className="k">Target 1</span><span style={{ color: "var(--long)" }}>{formatUSD(result.t1Target)}</span></div>
        <div className="planline"><span className="k">Target 2</span><span style={{ color: "var(--long)" }}>{formatUSD(result.t2Target)}</span></div>
        <div className="planline"><span className="k">Target 3</span><span style={{ color: "var(--long)" }}>{formatUSD(result.t3Target)}</span></div>
        <div className="planline"><span className="k">Expected R:R</span><span>{result.expectedRewardRisk.toFixed(1)}</span></div>
        <div className="planline"><span className="k">Entry Quality</span><span>{result.entryQuality.toFixed(0)}/100</span></div>
      </div>
      <div className="panel-box">
        <div className="ph" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Activity style={{ width: 12, height: 12 }} /> 7-Factor Breakdown</span>
          <span className="n">WEIGHTED</span>
        </div>
        {[
          { name: "Fair Value Deviation", w: 25, v: F.fairValue.score },
          { name: "Futures Crowding", w: 20, v: F.crowding.score },
          { name: "Momentum Exhaustion", w: 15, v: F.momentum.score },
          { name: "Volume Participation", w: 10, v: F.volume.score },
          { name: "Volatility Position", w: 10, v: F.volatility.score },
          { name: "Market Structure", w: 10, v: F.structure.score },
          { name: "Liquidation Pressure", w: 10, v: F.liquidation.score },
        ].map((f) => (
          <div key={f.name} className="factor-row">
            <div><span className="fname">{f.name}</span><span className="fw">{f.w}%</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{f.v.toFixed(0)}</span>
              <div className="bar"><span style={{ width: `${f.v}%`, background: f.v > 65 ? "var(--long)" : f.v > 45 ? "var(--amber)" : "var(--short)" }} /></div>
            </div>
          </div>
        ))}
        <div className="state-track">
          {["WATCHING", "STRETCHED", "ENTRY_NEAR", "ENTRY_TOUCHED", "INVALIDATED"].map((s) => (
            <div key={s} className={`state-step ${s === result.signalState ? "on" : ""}`}>{s}</div>
          ))}
        </div>
      </div>
      {result.reasons.length > 0 && (
        <div className="panel-box" style={{ padding: "10px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted2)" }}><CheckCircle2 style={{ width: 12, height: 12 }} /> Reasons</div>
          {result.reasons.map((r, i) => (<div key={i} style={{ fontSize: 11, color: "var(--muted)", marginBottom: 3 }}>• {r}</div>))}
        </div>
      )}
      {result.conflicts.length > 0 && (
        <div className="panel-box" style={{ padding: "10px 14px", borderColor: "rgba(255,92,92,0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--short)" }}><AlertTriangle style={{ width: 12, height: 12 }} /> Conflicts {result.conflictScore > 0 ? `(${Math.round(result.conflictScore)})` : ""}</div>
          {result.conflicts.map((c, i) => (<div key={i} style={{ fontSize: 11, color: "rgba(255,92,92,0.85)", marginBottom: 3 }}>• {c}</div>))}
        </div>
      )}
      <p style={{ fontSize: 10, color: "var(--muted2)" }}>Base: {coin.name.split(" ")[0]} · Last update {new Date(result.lastUpdate).toLocaleTimeString()}. Statistical fair-value analysis only.</p>
    </div>
  );
}

function OvervaluedSummary({ result }: { result: NonNullable<CoinDetailExtra["overvalued"]> }) {
  const isOver = result.direction === "overvalued";
  return (
    <div className="panel-box" style={{ padding: "10px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: isOver ? "var(--short)" : "var(--long)" }}>{isOver ? "SHORT SETUP" : "LONG SETUP"}</span>
        <span style={{ fontSize: 10, color: "var(--muted2)" }}>Opp {Math.round(result.opportunityScore)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
        <span style={{ color: "var(--muted2)" }}>{isOver ? "Short Entry" : "Long Entry"}</span>
        <span className="mono" style={{ color: "var(--amber)" }}>${result.predictedEntry.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
        <span style={{ color: "var(--muted2)" }}>R:R</span>
        <span className="mono">{result.expectedRewardRisk.toFixed(1)}</span>
      </div>
    </div>
  );
}

function StatTile({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div style={{ background: "var(--panel-raised)", border: "1px solid var(--hair)", borderRadius: "var(--radius-xs,6px)", padding: "10px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--muted2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{icon} {label}</div>
      <div className="mono" style={{ fontWeight: 600, fontSize: 13 }}>{value}</div>
      <div style={{ fontSize: 10, color: "var(--muted2)", marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function StatMini({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--panel-raised)", border: "1px solid var(--hair)", borderRadius: "var(--radius-xs,6px)", padding: "8px 10px", textAlign: "center" }}>
      <div style={{ fontSize: 9, color: "var(--muted2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{label}</div>
      <div className="mono" style={{ fontSize: 11, fontWeight: 600 }}>{value}</div>
    </div>
  );
}
