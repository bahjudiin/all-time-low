"use client";

import { useMemo } from "react";
import type { CoinMarket } from "@/types/coin";

export function TickerBar({ coins }: { coins: CoinMarket[] }) {
  const items = useMemo(() => {
    if (!coins || coins.length === 0) return null;
    const sorted = [...coins].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
    const top5 = sorted.slice(0, 5);
    const bot5 = sorted.slice(-5).reverse();

    return (
      <>
        {[...top5, ...bot5].map((c) => {
          const isUp = c.price_change_percentage_24h >= 0;
          return (
            <span key={c.id} className="tick">
              <span className={`dot ${isUp ? "long" : "short"}`} />
              <span className="sym">{c.symbol.toUpperCase()}</span>
              ${c.current_price.toLocaleString(undefined, { maximumFractionDigits: c.current_price < 1 ? 4 : 2 })}
              <span style={{ color: isUp ? "var(--long)" : "var(--short)" }}>
                {isUp ? "+" : ""}{c.price_change_percentage_24h.toFixed(1)}%
              </span>
            </span>
          );
        })}
      </>
    );
  }, [coins]);

  return (
    <div className="ticker-wrap">
      <div className="ticker-track">
        {items}
        <span className="tick mono" style={{ color: "var(--muted2)" }}>{"//"}</span>
        {items}
        <span className="tick mono" style={{ color: "var(--muted2)" }}>{"//"}</span>
        {items}
      </div>
    </div>
  );
}
