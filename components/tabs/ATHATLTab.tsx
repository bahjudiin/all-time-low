"use client";

import { useMemo } from "react";
import type { CoinMarket } from "@/types/coin";
import { useNavStore } from "@/lib/navStore";
import { useCoins } from "@/lib/useCoins";
import { DataTable } from "@/components/screener/DataTable";
import { SignalsListView } from "@/components/signals/SignalsListView";
import { SubTabBar } from "@/components/layout/SubTabBar";
import type { AthAtlSubTab } from "@/types/nav";

export function ATHATLTab({ initialCoins }: { initialCoins: CoinMarket[] }) {
  const { coins } = useCoins(initialCoins);
  const subTab = useNavStore((s) => s.athAtlSubTab);
  const setSubTab = useNavStore((s) => s.setAthAtlSubTab);
  const openModal = useNavStore((s) => s.openModal);

  const nearATH = useMemo(
    () =>
      coins
        .filter((c) => c.ath_change_percentage >= -15 && c.ath_change_percentage < 0)
        .sort((a, b) => b.market_cap - a.market_cap),
    [coins]
  );
  const nearATL = useMemo(
    () =>
      coins
        .filter((c) => c.atl_change_percentage <= 15 && c.atl_change_percentage > 0)
        .sort((a, b) => b.market_cap - a.market_cap),
    [coins]
  );

  const avgATH = coins.length > 0 ? coins.reduce((s, c) => s + c.ath_change_percentage, 0) / coins.length : 0;
  const avgATL = coins.length > 0 ? coins.reduce((s, c) => s + c.atl_change_percentage, 0) / coins.length : 0;
  const aboveATH = coins.filter((c) => c.ath_change_percentage >= 0).length;
  const within5 = coins.filter((c) => c.ath_change_percentage >= -5 && c.ath_change_percentage < 0).length;
  const within15 = nearATH.length;

  return (
    <>
      <div className="desk-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
          <h1 style={{ fontSize: 17, margin: 0, fontWeight: 600 }}>ATH / ATL</h1>
        </div>
      </div>

      <SubTabBar<AthAtlSubTab>
        tabs={[
          { id: "near-ath", label: "Near ATH" },
          { id: "near-atl", label: "Near ATL" },
          { id: "signals", label: "Signals" },
        ]}
        active={subTab}
        onChange={setSubTab}
      />

      <div className="breadth-row">
        <div className="breadth-cell">
          <div className="lbl">AVG DIST FROM ATH</div>
          <div className="val short">{avgATH.toFixed(1)}%</div>
        </div>
        <div className="breadth-cell">
          <div className="lbl">AVG DIST FROM ATL</div>
          <div className="val long">+{avgATL.toFixed(0)}%</div>
        </div>
        <div className="breadth-cell">
          <div className="lbl">% AT / ABOVE ATH</div>
          <div className="val amber">{coins.length > 0 ? ((aboveATH / coins.length) * 100).toFixed(0) : 0}%</div>
        </div>
        <div className="breadth-cell">
          <div className="lbl">WITHIN 5% OF ATH</div>
          <div className="val amber">{within5}</div>
        </div>
        <div className="breadth-cell">
          <div className="lbl">WITHIN 15% OF ATH</div>
          <div className="val amber">{within15}</div>
        </div>
      </div>

      <main className="flex-1" style={{ minHeight: 0, overflow: "hidden" }}>
        {subTab === "near-ath" ? (
          <DataTable data={nearATH} onRowClick={(c) => openModal(c.symbol)} />
        ) : subTab === "near-atl" ? (
          <DataTable data={nearATL} onRowClick={(c) => openModal(c.symbol)} />
        ) : (
          <SignalsListView />
        )}
      </main>
    </>
  );
}
