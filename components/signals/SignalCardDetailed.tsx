"use client";

import type { CoinWithDerived } from "@/types/coin";
import type { CoinSignals } from "@/types/signal";
import { SignalBadge } from "./SignalBadge";
import { GroupStatus } from "./GroupStatus";

interface SignalCardDetailedProps {
  coin: CoinWithDerived;
  signals: CoinSignals;
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
  const midRange = (distanceFromATH + distanceFromATL) / 2;

  return (
    <div className="panel-box" style={{ borderColor: isStrong ? (isLong ? "rgba(61,220,132,0.3)" : "rgba(255,92,92,0.3)") : undefined }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderBottom: "1px solid var(--hair)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src={coin.image} alt={coin.name} style={{ width: 28, height: 28, borderRadius: "50%" }} loading="lazy" />
          <div>
            <div style={{ fontWeight: 600, fontSize: 12, color: "var(--ink-primary)" }}>{coin.name}</div>
            <div className="mono" style={{ fontSize: 9, color: "var(--muted2)", textTransform: "uppercase" }}>{coin.symbol}</div>
          </div>
        </div>
        <SignalBadge direction={signals.direction} score={signals.score} maxScore={signals.maxScore} />
      </div>

      <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--hair)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
          <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-primary)" }}>
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
          <span className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>-{signals.maxScore}</span>
          <span className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>0</span>
          <span className="mono" style={{ fontSize: 9, color: "var(--muted)" }}>+{signals.maxScore}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, padding: "10px 12px", borderBottom: "1px solid var(--hair)" }}>
        <div className="panel-box" style={{ padding: "8px 8px", textAlign: "center" }}>
          <div style={{ fontSize: 9, color: "var(--muted2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>FROM ATH</div>
          <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: distanceFromATH > -10 ? "var(--short)" : distanceFromATH < -70 ? "var(--long)" : "var(--ink-secondary)" }}>{distanceFromATH}%</div>
          <div style={{ fontSize: 8, color: "var(--muted)", marginTop: 2 }}>{coin.ath_date ? new Date(coin.ath_date).toLocaleDateString() : "N/A"}</div>
        </div>
        <div className="panel-box" style={{ padding: "8px 8px", textAlign: "center" }}>
          <div style={{ fontSize: 9, color: "var(--muted2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>FROM ATL</div>
          <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: "var(--long)" }}>+{distanceFromATL}%</div>
          <div style={{ fontSize: 8, color: "var(--muted)", marginTop: 2 }}>{coin.atl_date ? new Date(coin.atl_date).toLocaleDateString() : "N/A"}</div>
        </div>
        <div className="panel-box" style={{ padding: "8px 8px", textAlign: "center" }}>
          <div style={{ fontSize: 9, color: "var(--muted2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>MID RANGE</div>
          <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: midRange > 0 ? "var(--long)" : "var(--short)" }}>{midRange > 0 ? "+" : ""}{midRange.toFixed(1)}%</div>
          <div style={{ fontSize: 8, color: "var(--muted)", marginTop: 2 }}>{midRange > 20 ? "Above mid" : midRange < -20 ? "Below mid" : "Near mid"}</div>
        </div>
      </div>

      {signals.priceTargets && (
        <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--hair)" }}>
          <div className="panel-box" style={{ padding: "10px 10px" }}>
            <div style={{ fontSize: 9, color: "var(--muted2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
              LIMIT LEVELS ({isLong ? "LONG" : "SHORT"})
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
                <div style={{ fontSize: 8, color: "var(--muted)" }}>BB Opp</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, padding: "10px 12px", borderBottom: "1px solid var(--hair)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 9, color: "var(--muted2)" }}>MCap</div>
          <div className="mono" style={{ fontSize: 11, color: "var(--ink-secondary)" }}>{coin.market_cap >= 1e9 ? `$${(coin.market_cap / 1e9).toFixed(1)}B` : `$${(coin.market_cap / 1e6).toFixed(0)}M`}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 9, color: "var(--muted2)" }}>Volume</div>
          <div className="mono" style={{ fontSize: 11, color: "var(--ink-secondary)" }}>{coin.total_volume >= 1e9 ? `$${(coin.total_volume / 1e9).toFixed(1)}B` : `$${(coin.total_volume / 1e6).toFixed(0)}M`}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 9, color: "var(--muted2)" }}>Vol/MCap</div>
          <div className="mono" style={{ fontSize: 11, color: coin.market_cap > 0 && coin.total_volume / coin.market_cap > 0.1 ? "var(--amber)" : "var(--muted2)" }}>
            {coin.market_cap > 0 ? ((coin.total_volume / coin.market_cap) * 100).toFixed(1) : "0"}%
          </div>
        </div>
      </div>

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
