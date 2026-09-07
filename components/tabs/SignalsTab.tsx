"use client";

import { SignalsListView } from "@/components/signals/SignalsListView";

export function SignalsTab() {
  return (
    <>
      <div className="desk-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5M19.1 4.9c3.9 3.9 3.9 10.3 0 14.2"/></svg>
          <h1 style={{ fontSize: 17, margin: 0, fontWeight: 600 }}>Signals</h1>
        </div>
      </div>

      <div className="about">
        <b>Multi-Factor Confluence Screener</b>
        <ul>
          <li>Full technical stack per coin: RSI, StochRSI, EMA 9/21, MACD, ADX, Bollinger, CCI, ATR, OBV <b>plus derivatives positioning</b> — funding rate, open interest, and Binance long/short ratios (global, top-account &quot;whale&quot;, top-position, taker aggressor).</li>
          <li>Collapses into a <b>7-group score (−7 to +7)</b> → Strong Long / Long / Lean / Wait / Short / Strong Short, with agreement% and L1–L3 targets + invalidation levels.</li>
        </ul>
      </div>

      <div className="flex-1" style={{ minHeight: 0, overflow: "hidden" }}>
        <SignalsListView />
      </div>
    </>
  );
}
