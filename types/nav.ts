export type NavTabId =
  | "ath-atl"
  | "pump-dump"
  | "over-under"
  | "liquidations"
  | "settings";

// Sub-tabs within each primary nav tab
export type AthAtlSubTab = "near-ath" | "near-atl" | "signals";
export type PumpDumpSubTab = "pump" | "pump-from-ath" | "dump" | "dump-from-atl";
export type OverUnderSubTab = "overvalued" | "undervalued" | "extreme" | "entry-near" | "high-conf" | "signals";
export type LiquidationSubTab = "long" | "short" | "mixed";

export interface MarketGlanceProps {
  coins: CoinGlance[];
}

export interface CoinGlance {
  symbol: string;
  name: string;
  priceChange24hPct: number;
  marketCap: number;
  totalVolume: number;
  athChangePct: number;
  atlChangePct: number;
}

export interface NavItem {
  id: NavTabId;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "ath-atl", label: "ATH/ATL" },
  { id: "pump-dump", label: "Pump/Dump" },
  { id: "over-under", label: "O/U" },
  { id: "liquidations", label: "Liq" },
  { id: "settings", label: "Settings" },
];

// Timeframes for liquidations signals: user wants coarse match by direction + timeframe
export const LIQ_TIMEFRAMES = [
  "1m",
  "5m",
  "10m",
  "15m",
  "1h",
  "4h",
  "12h",
  "24h",
  "7d",
  "14d",
  "30d",
] as const;
export type LiqTimeframe = (typeof LIQ_TIMEFRAMES)[number];

export interface LiqSignal {
  symbol: string;
  side: "long" | "short" | "mixed";
  totalUsd: number;
  longPct: number;
  shortPct: number;
  count: number;
  timeframe: LiqTimeframe;
  // cross-timeframe direction agreement
  agreementPct: number;
  agreementSamples: number;
  // derived forecast from liquidation direction
  predictedPump: boolean;
  predictedDump: boolean;
}

// Extra data shown inside the coin detail modal (optional per tab)
export interface CoinDetailExtra {
  overvalued?: {
    direction: string;
    opportunityScore: number;
    predictedEntry: number;
    reversalProbability: number;
    finalConfidence: number;
    expectedRewardRisk: number;
  };
  signals?: unknown;
  liq?: LiqSignal;
}