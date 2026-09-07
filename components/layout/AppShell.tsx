"use client";

import { useMemo } from "react";
import type { CoinMarket } from "@/types/coin";
import { useNavStore } from "@/lib/navStore";
import { useCoins } from "@/lib/useCoins";
import { LeftRail } from "@/components/layout/LeftRail";
import { TickerBar } from "@/components/layout/TickerBar";
import { SignalFeed } from "@/components/layout/SignalFeed";
import { CoinModal } from "@/components/layout/CoinModal";
import { ATHATLTab } from "@/components/tabs/ATHATLTab";
import { PumpDumpTab } from "@/components/tabs/PumpDumpTab";
import { OverUnderTab } from "@/components/tabs/OverUnderTab";
import { LiquidationsTab } from "@/components/tabs/LiquidationsTab";
import { SignalsTab } from "@/components/tabs/SignalsTab";
import { SettingsTab } from "@/components/tabs/SettingsTab";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export function AppShell({
  initialCoins,
  fetchError,
}: {
  initialCoins: CoinMarket[];
  fetchError?: boolean;
}) {
  const activeNavTab = useNavStore((s) => s.activeNavTab);
  const modalSymbol = useNavStore((s) => s.modalSymbol);
  const modalExtra = useNavStore((s) => s.modalExtra);
  const feedOpen = useNavStore((s) => s.feedOpen);

  const { resolveCoin } = useCoins(initialCoins);
  const selectedCoin = useMemo(
    () => (modalSymbol ? resolveCoin(modalSymbol) : null),
    [modalSymbol, resolveCoin]
  );

  return (
    <div className="flex flex-col h-dvh" style={{ background: "var(--ink)", color: "var(--text)" }}>
      <TickerBar coins={initialCoins} />
      {fetchError && (
        <div style={{ padding: "6px 16px", background: "rgba(255,92,92,0.08)", borderBottom: "1px solid var(--hair)", fontSize: 11, color: "var(--short)", textAlign: "center" }}>
          Failed to load market data. Pull to refresh or try again later.
        </div>
      )}
      <div className="flex flex-1 min-h-0">
        <LeftRail />
        <main className="flex-1 min-w-0 overflow-y-auto" style={{ padding: "16px 18px" }}>
          <ErrorBoundary key={activeNavTab}>
            {activeNavTab === "ath-atl" && <ATHATLTab initialCoins={initialCoins} />}
            {activeNavTab === "pump-dump" && <PumpDumpTab initialCoins={initialCoins} />}
            {activeNavTab === "over-under" && <OverUnderTab />}
            {activeNavTab === "liquidations" && <LiquidationsTab />}
            {activeNavTab === "signals" && <SignalsTab />}
            {activeNavTab === "settings" && <SettingsTab />}
          </ErrorBoundary>
        </main>
        {feedOpen && <SignalFeed />}
      </div>
      <CoinModal coin={selectedCoin} extra={modalExtra ?? undefined} />
    </div>
  );
}
