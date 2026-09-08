"use client";

import type { CoinWithDerived } from "@/types/coin";
import type { CoinSignals } from "@/types/signal";
import { SignalBadge } from "./SignalBadge";
import { GroupStatus } from "./GroupStatus";

interface SignalCardDetailedProps {
  coin: CoinWithDerived;
  signals: CoinSignals;
}

function DirectionBanner({ direction, score }: { direction: string; score: number }) {
  const config: Record<string, { bg: string; border: string; text: string; label: string; icon: string }> = {
    strong_long: { bg: "rgba(14, 203, 129, 0.08)", border: "rgba(14, 203, 129, 0.25)", text: "var(--long)", label: "STRONG LONG", icon: "▲▲" },
    long: { bg: "rgba(14, 203, 129, 0.05)", border: "rgba(14, 203, 129, 0.15)", text: "var(--long)", label: "LONG", icon: "▲" },
    lean_long: { bg: "rgba(14, 203, 129, 0.03)", border: "rgba(14, 203, 129, 0.1)", text: "var(--long)", label: "LEAN LONG", icon: "△" },
    wait: { bg: "rgba(112, 122, 138, 0.05)", border: "rgba(112, 122, 138, 0.15)", text: "var(--muted2)", label: "WAIT", icon: "—" },
    lean_short: { bg: "rgba(246, 70, 93, 0.03)", border: "rgba(246, 70, 93, 0.1)", text: "var(--short)", label: "LEAN SHORT", icon: "▽" },
    short: { bg: "rgba(246, 70, 93, 0.05)", border: "rgba(246, 70, 93, 0.15)", text: "var(--short)", label: "SHORT", icon: "▼" },
    strong_short: { bg: "rgba(246, 70, 93, 0.08)", border: "rgba(246, 70, 93, 0.25)", text: "var(--short)", label: "STRONG SHORT", icon: "▼▼" },
  };
  const c = config[direction] ?? config.wait;
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: "var(--radius-md)", padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: c.text, letterSpacing: "0.05em" }}>{c.icon} {c.label}</span>
      <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: c.text }}>{score > 0 ? "+" : ""}{score}</span>
    </div>
  );
}

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "6px 4px" }}>
      <div style={{ fontSize: 9, color: "var(--muted2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{label}</div>
      <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: color ?? "var(--text)" }}>{value}</div>
      {sub && <div className="mono" style={{ fontSize: 9, color: "var(--muted)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function PredictionBlock({ prediction, isLong, currentPrice }: { prediction: NonNullable<CoinSignals["prediction"]>; isLong: boolean; currentPrice: number }) {
  const entryGap = ((prediction.entry - currentPrice) / currentPrice * 100);
  const rewardPct = ((prediction.exit - prediction.entry) / prediction.entry * 100);
  const riskPct = Math.abs((prediction.stop - prediction.entry) / prediction.entry * 100);

  return (
    <div style={{ padding: "12px", borderBottom: "1px solid var(--hair)" }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--muted2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
        🎯 Entry / Exit / Stop
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <div style={{ background: isLong ? "rgba(14, 203, 129, 0.06)" : "rgba(246, 70, 93, 0.06)", border: `1px solid ${isLong ? "rgba(14, 203, 129, 0.12)" : "rgba(246, 70, 93, 0.12)"}`, borderRadius: "var(--radius-sm)", padding: "8px 6px", textAlign: "center" }}>
          <div style={{ fontSize: 8, color: "var(--muted2)", marginBottom: 2, textTransform: "uppercase" }}>ENTRY</div>
          <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: isLong ? "var(--long)" : "var(--short)" }}>
            ${prediction.entry.toLocaleString(undefined, { maximumFractionDigits: 4 })}
          </div>
          <div className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>
            {entryGap >= 0 ? "+" : ""}{entryGap.toFixed(1)}% gap
          </div>
        </div>
        <div style={{ background: "rgba(14, 203, 129, 0.06)", border: "1px solid rgba(14, 203, 129, 0.12)", borderRadius: "var(--radius-sm)", padding: "8px 6px", textAlign: "center" }}>
          <div style={{ fontSize: 8, color: "var(--muted2)", marginBottom: 2, textTransform: "uppercase" }}>EXIT</div>
          <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: "var(--long)" }}>
            ${prediction.exit.toLocaleString(undefined, { maximumFractionDigits: 4 })}
          </div>
          <div className="mono" style={{ fontSize: 9, color: "var(--long)" }}>+{rewardPct.toFixed(1)}%</div>
        </div>
        <div style={{ background: "rgba(246, 70, 93, 0.06)", border: "1px solid rgba(246, 70, 93, 0.12)", borderRadius: "var(--radius-sm)", padding: "8px 6px", textAlign: "center" }}>
          <div style={{ fontSize: 8, color: "var(--muted2)", marginBottom: 2, textTransform: "uppercase" }}>STOP</div>
          <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: "var(--short)" }}>
            ${prediction.stop.toLocaleString(undefined, { maximumFractionDigits: 4 })}
          </div>
          <div className="mono" style={{ fontSize: 9, color: "var(--short)" }}>−{riskPct.toFixed(1)}%</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, padding: "6px 8px", background: "var(--panel-raised)", borderRadius: "var(--radius-sm)" }}>
        <span className="mono" style={{ fontSize: 10, color: "var(--muted2)" }}>{prediction.method}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 9, color: "var(--muted2)" }}>R:R</span>
          <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: prediction.rrRatio >= 2 ? "var(--long)" : "var(--amber)" }}>
            {prediction.rrRatio.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function SignalCardDetailed({ coin, signals }: SignalCardDetailedProps) {
  const groups = [
    signals.momentum,
    signals.trend,
    signals.marketStructure,
    signals.crowdSentiment,
    signals.volumeFlow,
    signals.confirmation,
    signals.athAtlPosition,
  ];

  const leftGroups = groups.slice(0, 4);
  const rightGroups = groups.slice(4);

  const agreedCount = groups.filter((g) => g.agreed).length;
  const longGroups = groups.filter((g) => g.signal === 1).length;
  const shortGroups = groups.filter((g) => g.signal === -1).length;
  const activeGroups = groups.filter((g) => g.signal !== 0).length;
  const scoreBarPct = ((signals.score + signals.maxScore) / (signals.maxScore * 2)) * 100;

  const isStrong = signals.direction === "strong_long" || signals.direction === "strong_short";
  const isLong = signals.direction.includes("long");

  const distanceFromATH = coin.ath_change_percentage;
  const distanceFromATL = coin.atl_change_percentage;

  return (
    <div className="panel-box" style={{ borderColor: isStrong ? (isLong ? "rgba(14, 203, 129, 0.2)" : "rgba(246, 70, 93, 0.2)") : undefined }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderBottom: "1px solid var(--hair)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src={coin.image} alt={coin.name} style={{ width: 28, height: 28, borderRadius: "50%" }} loading="lazy" />
          <div>
            <div style={{ fontWeight: 600, fontSize: 12, color: "var(--text)" }}>{coin.name}</div>
            <div className="mono" style={{ fontSize: 9, color: "var(--muted2)", textTransform: "uppercase" }}>{coin.symbol}</div>
          </div>
        </div>
        <SignalBadge direction={signals.direction} score={signals.score} maxScore={signals.maxScore} />
      </div>

      <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--hair)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
          <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
            ${coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: coin.price_change_percentage_24h >= 0 ? "var(--long)" : "var(--short)" }}>
            {coin.price_change_percentage_24h >= 0 ? "+" : ""}{coin.price_change_percentage_24h.toFixed(2)}%
          </span>
        </div>
        <div style={{ position: "relative", height: 4, background: "var(--panel-raised)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, borderRadius: 2, background: signals.score > 0 ? "var(--long)" : signals.score < 0 ? "var(--short)" : "var(--muted)", width: `${Math.min(100, Math.max(0, scoreBarPct))}%` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
          <span className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>Bear −{signals.maxScore}</span>
          <span className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>Bull +{signals.maxScore}</span>
        </div>
      </div>

      <DirectionBanner direction={signals.direction} score={signals.score} />

      {signals.prediction && (
        <PredictionBlock prediction={signals.prediction} isLong={isLong} currentPrice={coin.current_price} />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, padding: "10px 12px", borderBottom: "1px solid var(--hair)" }}>
        <MetricCard label="FROM ATH" value={`${distanceFromATH}%`} sub={coin.ath_date ? new Date(coin.ath_date).toLocaleDateString() : "N/A"} color={distanceFromATH > -10 ? "var(--short)" : distanceFromATH < -70 ? "var(--long)" : "var(--text)"} />
        <MetricCard label="FROM ATL" value={`+${distanceFromATL}%`} sub={coin.atl_date ? new Date(coin.atl_date).toLocaleDateString() : "N/A"} color="var(--long)" />
        <MetricCard label="MCap" value={coin.market_cap >= 1e9 ? `$${(coin.market_cap / 1e9).toFixed(1)}B` : `$${(coin.market_cap / 1e6).toFixed(0)}M`} />
      </div>

      {signals.priceTargets && (
        <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--hair)" }}>
          <div style={{ fontSize: 9, color: "var(--muted2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
            TARGETS ({isLong ? "LONG" : "SHORT"})
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
            {[
              { label: "L1", price: signals.priceTargets.l1.price, dist: signals.priceTargets.l1.distance, src: signals.priceTargets.l1.source },
              { label: "L2", price: signals.priceTargets.l2.price, dist: signals.priceTargets.l2.distance, src: signals.priceTargets.l2.source },
              { label: "L3", price: signals.priceTargets.l3.price, dist: signals.priceTargets.l3.distance, src: signals.priceTargets.l3.source },
            ].map((t) => (
              <div key={t.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 8, color: "var(--muted2)", marginBottom: 3 }}>{t.label}</div>
                <div className="mono" style={{ fontSize: 11, fontWeight: 700, color: isLong ? "var(--long)" : "var(--short)" }}>${t.price.toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
                <div className="mono" style={{ fontSize: 9, color: t.dist > 0 ? "var(--long)" : "var(--short)" }}>{t.dist > 0 ? "+" : ""}{t.dist}%</div>
                <div style={{ fontSize: 8, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.src}</div>
              </div>
            ))}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 8, color: "var(--muted2)", marginBottom: 3 }}>STOP</div>
              <div className="mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--amber)" }}>${signals.priceTargets.invalidation.toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
              <div className="mono" style={{ fontSize: 9, color: isLong ? "var(--short)" : "var(--long)" }}>{isLong ? "↓" : "↑"} Invalid</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "10px 12px", borderBottom: "1px solid var(--hair)" }}>
        <div>
          {leftGroups.map((group) => (
            <GroupStatus key={group.name} group={group} />
          ))}
        </div>
        <div>
          {rightGroups.map((group) => (
            <GroupStatus key={group.name} group={group} />
          ))}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--long)" }}>{longGroups}↑</span>
          <span className="mono" style={{ fontSize: 11, color: "var(--muted2)" }}>{activeGroups - longGroups - shortGroups}—</span>
          <span className="mono" style={{ fontSize: 11, color: "var(--short)" }}>{shortGroups}↓</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="mono" style={{ fontSize: 10, color: "var(--muted2)" }}>{agreedCount}/{groups.length} agreed</span>
          <span className="mono" style={{ fontSize: 10, color: "var(--muted2)" }}>{signals.agreementPct}% conf</span>
        </div>
      </div>
    </div>
  );
}
