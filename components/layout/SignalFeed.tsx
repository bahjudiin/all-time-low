"use client";

import { useState, useEffect, useRef } from "react";

interface FeedItem {
  id: number;
  sym: string;
  desk: string;
  text: string;
  side: "long" | "short" | "amber";
  time: string;
}

const FEED_POOL = [
  { sym: "BTC", desk: "Over / Under", text: "ENTRY_NEAR fired · Overvalued · conf 78%", side: "short" as const },
  { sym: "AVAX", desk: "Liquidations", text: "89% short liq dominance, 6/7 TF agree → PUMP", side: "long" as const },
  { sym: "SOL", desk: "Signals", text: "Score +6 · Strong Long · 88% agreement", side: "long" as const },
  { sym: "SUI", desk: "Pump / Dump", text: "+11.3% 24h · momentum breakout", side: "long" as const },
  { sym: "ETH", desk: "Over / Under", text: "STRETCHED · Overvalued · conf 52%", side: "short" as const },
  { sym: "DOGE", desk: "ATH / ATL", text: "Within 5% of ATH · trophy zone", side: "amber" as const },
  { sym: "ARB", desk: "Pump / Dump", text: "Bounce off -64% ATH drop building", side: "amber" as const },
  { sym: "XRP", desk: "Signals", text: "Score -2 · Lean Short · 41% agreement", side: "short" as const },
  { sym: "LINK", desk: "Over / Under", text: "WATCHING · conflict engine flags 3 signals", side: "amber" as const },
  { sym: "SUI", desk: "Liquidations", text: "81% long liq dominance, 5/7 TF agree → DUMP", side: "short" as const },
];

export function SignalFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const idx = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const pool = FEED_POOL[idx.current % FEED_POOL.length];
      idx.current++;
      const now = new Date();
      const ts = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const item: FeedItem = { id: Date.now(), ...pool, time: ts };
      setItems((prev) => [item, ...prev].slice(0, 14));
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  const badgeColor = (side: string) =>
    side === "long" ? "var(--long)" : side === "short" ? "var(--short)" : "var(--amber)";

  return (
    <aside
      className="feed-panel flex flex-col flex-shrink-0"
      style={{
        width: 280,
        background: "var(--panel)",
        borderLeft: "1px solid var(--hair)",
      }}
    >
      <div className="feed-head">
        <div className="t">
          <span className="live" />
          SIGNALS — LIVE FEED
        </div>
        <div className="sub">EVERY DESK · EVERY COIN</div>
      </div>
      <div ref={listRef} className="feed-list">
        {items.map((item) => (
          <div key={item.id} className="feed-item">
            <div className="top">
              <span className="sym">{item.sym}</span>
              <span className="time">{item.time}</span>
            </div>
            <div>
              <span
                className="badge"
                style={{
                  background: `${badgeColor(item.side)}18`,
                  color: badgeColor(item.side),
                }}
              >
                {item.side.toUpperCase()}
              </span>
            </div>
            <div className="desk">{item.desk} — {item.text}</div>
          </div>
        ))}
      </div>
    </aside>
  );
}
