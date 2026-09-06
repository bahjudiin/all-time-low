"use client";

import { useMemo } from "react";
import type { CoinMarket } from "@/types/coin";
import { useNavStore } from "@/lib/navStore";
import { useCoins } from "@/lib/useCoins";
import { DataTable } from "@/components/screener/DataTable";
import { MarketGlanceStrip, type GlanceMetric } from "@/components/layout/MarketGlanceStrip";
import { SubTabBar } from "@/components/layout/SubTabBar";
import { formatCompact } from "@/lib/format";

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

  const metrics: GlanceMetric[] = useMemo(() => {
    if (coins.length === 0) return [];
    const avgChange = coins.reduce((s, c) => s + c.price_change_percentage_24h, 0) / coins.length;
    const pumps = coins.filter((c) => c.price_change_percentage_24h > 10);
    const dumps = coins.filter((c) => c.price_change_percentage_24h < -10);
    const top = strongestPump[0];
    const bot = strongestDump[0];
    return [
      { label: "AVG 24h", value: `${avgChange >= 0 ? "+" : ""}${avgChange.toFixed(2)}%`, color: avgChange >= 0 ? "text-green-400" : "text-red-400" },
      { label: "Pumps >10%", value: String(pumps.length), color: "text-green-400" },
      { label: "Dumps <10%", value: String(dumps.length), color: "text-red-400" },
      { label: "Top", value: top ? `${top.symbol.toUpperCase()} +${top.price_change_percentage_24h.toFixed(1)}%` : "—", color: "text-green-400" },
      { label: "Bot", value: bot ? `${bot.symbol.toUpperCase()} ${bot.price_change_percentage_24h.toFixed(1)}%` : "—", color: "text-red-400" },
      { label: "Vol", value: formatCompact(coins.reduce((s, c) => s + c.total_volume, 0)) },
    ];
  }, [coins, strongestPump, strongestDump]);

  const data =
    subTab === "pump" ? strongestPump : subTab === "pump-from-ath" ? biggestPump : subTab === "dump-from-atl" ? biggestDump : strongestDump;

  return (
    <>
      <SubTabBar
        tabs={[
          { id: "pump", label: "Strongest Pump" },
          { id: "pump-from-ath", label: "Pump from ATH Drop" },
          { id: "dump", label: "Strongest Dump" },
          { id: "dump-from-atl", label: "Dump from ATL" },
        ]}
        active={subTab}
        onChange={setSubTab}
      />
      <MarketGlanceStrip metrics={metrics} />
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <DataTable data={data} onRowClick={(c) => openModal(c.symbol)} />
      </main>
    </>
  );
}