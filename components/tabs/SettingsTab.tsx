"use client";

import { useScreenerStore, setCurrency, setRowsPerPage } from "@/lib/store";

export function SettingsTab() {
  const currency = useScreenerStore((s) => s.currency);
  const rowsPerPage = useScreenerStore((s) => s.rowsPerPage);

  return (
    <>
      <div className="desk-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          <h1 style={{ fontSize: 17, margin: 0, fontWeight: 600 }}>Settings</h1>
        </div>
      </div>

      <div className="panel-box">
        <div className="settings-row">
          <div>
            <div className="k">Display currency</div>
            <div className="d">Applies across all desks</div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {["usd", "eur", "gbp", "jpy"].map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className="mono"
                style={{
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 600,
                  border: "1px solid var(--hair)",
                  borderRadius: 2,
                  background: currency === c ? "var(--amber)" : "var(--panel)",
                  color: currency === c ? "var(--ink)" : "var(--muted)",
                  cursor: "pointer",
                  textTransform: "uppercase",
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-row">
          <div>
            <div className="k">Rows per page</div>
            <div className="d">Table pagination density</div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {[50, 100, 250].map((n) => (
              <button
                key={n}
                onClick={() => setRowsPerPage(n)}
                className="mono"
                style={{
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 600,
                  border: "1px solid var(--hair)",
                  borderRadius: 2,
                  background: rowsPerPage === n ? "var(--amber)" : "var(--panel)",
                  color: rowsPerPage === n ? "var(--ink)" : "var(--muted)",
                  cursor: "pointer",
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-row">
          <div>
            <div className="k">Data sources</div>
            <div className="d">Binance USDT-M · Bybit · OKX · Coinalyze · alternative.me</div>
          </div>
          <span className="badge long">ALL CONNECTED</span>
        </div>

        <div className="settings-row">
          <div>
            <div className="k">Liquidation cascade threshold</div>
            <div className="d">Minimum one-sided dominance to fire a signal</div>
          </div>
          <span className="mono" style={{ color: "var(--amber)" }}>80%</span>
        </div>
      </div>

      <div className="panel-box">
        <div className="ph">Disclaimer</div>
        <div style={{ padding: "12px 14px", color: "var(--muted)", lineHeight: 1.6, fontSize: 11.5 }}>
          All scores, states, and trade plans shown are model outputs derived from public market data and are not financial advice.
          Composite scores are probabilistic and can be wrong; confidence is penalized by a conflict engine that detects contradictory signals across factor groups, not eliminated by it.
        </div>
      </div>
    </>
  );
}
