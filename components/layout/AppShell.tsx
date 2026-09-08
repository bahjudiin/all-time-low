"use client";

import { useMemo } from "react";
import type { CoinMarket } from "@/types/coin";
import { useNavStore } from "@/lib/navStore";
import { useCoins } from "@/lib/useCoins";
import { CoinModal } from "@/components/layout/CoinModal";
import { ATHATLTab } from "@/components/tabs/ATHATLTab";
import { OverUnderTab } from "@/components/tabs/OverUnderTab";
import { SettingsTab } from "@/components/tabs/SettingsTab";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { NAV_ITEMS } from "@/types/nav";

export function AppShell({
  initialCoins,
  fetchError,
}: {
  initialCoins: CoinMarket[];
  fetchError?: boolean;
}) {
  const activeNavTab = useNavStore((s) => s.activeNavTab);
  const setActiveNavTab = useNavStore((s) => s.setActiveNavTab);
  const modalSymbol = useNavStore((s) => s.modalSymbol);
  const modalExtra = useNavStore((s) => s.modalExtra);

  const { resolveCoin } = useCoins(initialCoins);
  const selectedCoin = useMemo(
    () => (modalSymbol ? resolveCoin(modalSymbol) : null),
    [modalSymbol, resolveCoin]
  );

  return (
    <div className="flex flex-col h-dvh" style={{ background: "var(--ink)", color: "var(--text)" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          height: 48,
          background: "var(--panel)",
          borderBottom: "1px solid var(--hair)",
          flexShrink: 0,
          padding: "0 16px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            fontSize: 13,
            color: "var(--amber)",
            marginRight: 24,
            letterSpacing: "-0.02em",
          }}
        >
          ALL TIME LOW
        </span>
        <nav style={{ display: "flex", gap: 0, height: "100%" }}>
          {NAV_ITEMS.map((item) => {
            const active = activeNavTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNavTab(item.id)}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom: `2px solid ${active ? "var(--amber)" : "transparent"}`,
                  color: active ? "var(--text)" : "var(--muted)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  padding: "0 16px",
                  cursor: "pointer",
                  height: "100%",
                  transition: "color 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      {fetchError && (
        <div
          style={{
            padding: "6px 16px",
            background: "rgba(255,92,92,0.08)",
            borderBottom: "1px solid var(--hair)",
            fontSize: 11,
            color: "var(--short)",
            textAlign: "center",
          }}
        >
          Failed to load market data. Pull to refresh or try again later.
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        <main
          className="flex-1 min-w-0 overflow-y-auto"
          style={{ padding: "16px 18px" }}
        >
          <ErrorBoundary key={activeNavTab}>
            {activeNavTab === "ath-atl" && <ATHATLTab initialCoins={initialCoins} />}
            {activeNavTab === "over-under" && <OverUnderTab />}
            {activeNavTab === "settings" && <SettingsTab />}
          </ErrorBoundary>
        </main>
      </div>

      <CoinModal coin={selectedCoin} extra={modalExtra ?? undefined} />
    </div>
  );
}
