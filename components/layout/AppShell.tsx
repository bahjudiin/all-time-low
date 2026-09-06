"use client";

import { useMemo } from "react";
import type { CoinMarket } from "@/types/coin";
import { useNavStore } from "@/lib/navStore";
import { useCoins } from "@/lib/useCoins";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { CoinModal } from "@/components/layout/CoinModal";
import { ATHATLTab } from "@/components/tabs/ATHATLTab";
import { PumpDumpTab } from "@/components/tabs/PumpDumpTab";
import { OverUnderTab } from "@/components/tabs/OverUnderTab";
import { LiquidationsTab } from "@/components/tabs/LiquidationsTab";
import { SettingsTab } from "@/components/tabs/SettingsTab";

export function AppShell({ initialCoins }: { initialCoins: CoinMarket[] }) {
  const activeNavTab = useNavStore((s) => s.activeNavTab);
  const modalSymbol = useNavStore((s) => s.modalSymbol);
  const modalExtra = useNavStore((s) => s.modalExtra);

  const { resolveCoin } = useCoins(initialCoins);
  const selectedCoin = useMemo(
    () => (modalSymbol ? resolveCoin(modalSymbol) : null),
    [modalSymbol, resolveCoin]
  );

  return (
    <div className="flex flex-col h-dvh bg-background text-foreground">
      <TopBar />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {activeNavTab === "ath-atl" && <ATHATLTab initialCoins={initialCoins} />}
        {activeNavTab === "pump-dump" && <PumpDumpTab initialCoins={initialCoins} />}
        {activeNavTab === "over-under" && <OverUnderTab />}
        {activeNavTab === "liquidations" && <LiquidationsTab />}
        {activeNavTab === "settings" && <SettingsTab />}
      </div>
      <CoinModal coin={selectedCoin} extra={modalExtra ?? undefined} />
      <BottomNav />
      {/* spacer for fixed bottom nav */}
      <div className="h-14 shrink-0" />
    </div>
  );
}