"use client";

import { useScreenerStore, setCurrency, setRowsPerPage } from "@/lib/store";

export function SettingsTab() {
  const currency = useScreenerStore((s) => s.currency);
  const rowsPerPage = useScreenerStore((s) => s.rowsPerPage);

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-xl mx-auto p-4 md:p-6 space-y-4">
        <Section title="Currency">
          <div className="flex gap-2">
            {["usd", "eur", "gbp", "jpy"].map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors uppercase ${
                  currency === c ? "bg-blue-600 text-white" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Rows per page">
          <div className="flex gap-2">
            {[50, 100, 250].map((n) => (
              <button
                key={n}
                onClick={() => setRowsPerPage(n)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  rowsPerPage === n ? "bg-blue-600 text-white" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </Section>

        <Section title="About">
          <p className="text-sm text-zinc-500 leading-relaxed">
            ATH/ATL Tracker scans crypto markets for coins near all-time highs and lows,
            tracks pump/dump momentum, computes statistical over/under valuation from
            futures data, and surfaces liquidation dominance signals.
            Signals are estimates — not financial advice.
          </p>
        </Section>

        <Section title="Data Sources">
          <ul className="text-sm text-zinc-400 space-y-1">
            <li>• CoinGecko — market data</li>
            <li>• Binance / OKX / Bybit — futures, funding, OI, liquidations</li>
          </ul>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
      <h2 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">{title}</h2>
      {children}
    </div>
  );
}