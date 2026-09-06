"use client";

import { useMemo } from "react";
import type { CoinMarket } from "@/types/coin";
import { useNavStore } from "@/lib/navStore";
import { useCoins } from "@/lib/useCoins";
import { DataTable } from "@/components/screener/DataTable";
import { SignalsListView } from "@/components/signals/SignalsListView";
import { MarketGlanceStrip, type GlanceMetric } from "@/components/layout/MarketGlanceStrip";
import { SubTabBar } from "@/components/layout/SubTabBar";
import { formatCompact } from "@/lib/format";

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

  const metrics: GlanceMetric[] = useMemo(() => {
    if (coins.length === 0) return [];
    const totalMarketCap = coins.reduce((s, c) => s + c.market_cap, 0);
    const avgATHDistance = coins.reduce((s, c) => s + c.ath_change_percentage, 0) / coins.length;
    const avgATLDistance = coins.reduce((s, c) => s + c.atl_change_percentage, 0) / coins.length;
    const aboveATH = coins.filter((c) => c.ath_change_percentage >= 0).length;
    const deepestDrop = [...coins].sort((a, b) => a.ath_change_percentage - b.ath_change_percentage)[0];
    return [
      { label: "MCap", value: formatCompact(totalMarketCap) },
      { label: "AVG ATH", value: `${avgATHDistance.toFixed(1)}%`, color: avgATHDistance >= -30 ? "text-amber-400" : "text-red-400" },
      { label: "AVG ATL", value: `+${avgATLDistance.toFixed(1)}%`, color: "text-green-400" },
      { label: "Above ATH", value: String(aboveATH), color: "text-green-400" },
      { label: "Near ATH", value: String(nearATH.length), color: "text-amber-400" },
      { label: "Near ATL", value: String(nearATL.length), color: "text-blue-400" },
      { label: "Deepest Drop", value: deepestDrop ? `${deepestDrop.symbol.toUpperCase()} ${deepestDrop.ath_change_percentage.toFixed(1)}%` : "—", color: "text-red-400" },
    ];
  }, [coins, nearATH, nearATL]);

  return (
    <>
      <SubTabBar
        tabs={[
          { id: "near-ath", label: "Near ATH" },
          { id: "near-atl", label: "Near ATL" },
          { id: "signals", label: "Signals" },
        ]}
        active={subTab}
        onChange={setSubTab}
      />
      <MarketGlanceStrip metrics={metrics} />
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {subTab === "near-ath" ? (
          <DataTable
            data={nearATH}
            onRowClick={(c) => openModal(c.symbol)}
          />
        ) : subTab === "near-atl" ? (
          <DataTable
            data={nearATL}
            onRowClick={(c) => openModal(c.symbol)}
          />
        ) : (
          <SignalsListView />
        )}
      </main>
    </>
  );
}