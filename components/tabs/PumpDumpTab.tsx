"use client";

import { useMemo } from "react";
import type { CoinMarket } from "@/types/coin";
import { useNavStore } from "@/lib/navStore";
import { useCoins } from "@/lib/useCoins";
import { DataTable } from "@/components/screener/DataTable";
import { formatCompact } from "@/lib/format";
import { SubTabBar } from "@/components/layout/SubTabBar";
import type { PumpDumpSubTab } from "@/types/nav";

export function PumpDumpTab({ initialCoins }: { initialCoins: CoinMarket[] }) {
  const { coins } = useCoins(initialCoins);
  const subTab = useNavStore((s) => s.pumpDumpSubTab);
  const setSubTab = useNavStore((s) => s.setPumpDumpSubTab);
  const openModal = useNavStore((s) => s.openModal);

  const strongestPump = useMemo(
    () => [...coins].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0, 50),
    [coins]
  );
  const biggestPump = useMemo(
    () => [...coins].filter((c) => c.price_change_percentage_24h > 0).sort((a, b) => a.ath_change_percentage - b.ath_change_percentage).slice(0, 50),
    [coins]
  );
  const strongestDump = useMemo(
    () => [...coins].sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h).slice(0, 50),
    [coins]
  );
  const biggestDump = useMemo(
    () => [...coins].filter((c) => c.price_change_percentage_24h < 0).sort((a, b) => b.ath_change_percentage - a.ath_change_percentage).slice(0, 50),
    [coins]
  );

  const avgChange = coins.length > 0 ? coins.reduce((s, c) => s + c.price_change_percentage_24h, 0) / coins.length : 0;
  const advancers = coins.filter((c) => c.price_change_percentage_24h > 0).length;
  const decliners = coins.filter((c) => c.price_change_percentage_24h < 0).length;
  const gt5 = coins.filter((c) => c.price_change_percentage_24h >= 5).length;
  const ltn5 = coins.filter((c) => c.price_change_percentage_24h <= -5).length;
  const gt10 = coins.filter((c) => Math.abs(c.price_change_percentage_24h) >= 10).length;
  const combinedVol = coins.reduce((s, c) => s + c.total_volume, 0);
  const top = strongestPump[0];
  const bot = strongestDump[0];

  const data =
    subTab === "pump" ? strongestPump : subTab === "pump-from-ath" ? biggestPump : subTab === "dump-from-atl" ? biggestDump : strongestDump;

  return (
    <>
      <div className="desk-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>
          <h1 style={{ fontSize: 17, margin: 0, fontWeight: 600 }}>Pump / Dump</h1>
        </div>
      </div>

      <SubTabBar<PumpDumpSubTab>
        tabs={[
          { id: "pump", label: "Strongest Pump" },
          { id: "pump-from-ath", label: "Pump from ATH Drop" },
          { id: "dump", label: "Strongest Dump" },
          { id: "dump-from-atl", label: "Dump from ATL" },
        ]}
        active={subTab}
        onChange={setSubTab}
      />

      <div className="breadth-row">
        <div className="breadth-cell">
          <div className="lbl">ADVANCERS / DECLINERS</div>
          <div className="val"><span className="long">{advancers}</span> / <span className="short">{decliners}</span></div>
        </div>
        <div className="breadth-cell">
          <div className="lbl">+5% / −5% MOVES</div>
          <div className="val"><span className="long">{gt5}</span> / <span className="short">{ltn5}</span></div>
        </div>
        <div className="breadth-cell">
          <div className="lbl">&gt;10% BAND</div>
          <div className="val amber">{gt10}</div>
        </div>
        <div className="breadth-cell">
          <div className="lbl">AVG 24h</div>
          <div className={`val ${avgChange >= 0 ? "long" : "short"}`}>{avgChange >= 0 ? "+" : ""}{avgChange.toFixed(1)}%</div>
        </div>
        <div className="breadth-cell">
          <div className="lbl">COMBINED VOL</div>
          <div className="val">{formatCompact(combinedVol)}</div>
        </div>
      </div>

      <div className="panel-box">
        <div className="ph">
          24h Movers
          <span className="n">TOP: {top?.symbol.toUpperCase()} +{top?.price_change_percentage_24h.toFixed(1)}% · BOT: {bot?.symbol.toUpperCase()} {bot?.price_change_percentage_24h.toFixed(1)}%</span>
        </div>
        <div className="scroll-x" style={{ maxHeight: 420 }}>
          <DataTable data={data} onRowClick={(c) => openModal(c.symbol)} />
        </div>
      </div>
    </>
  );
}
