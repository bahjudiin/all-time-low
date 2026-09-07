import type { OvervaluedUndervaluedResult } from "@/lib/overvaluedUndervalued";

export type NavTabId =
  | "ath-atl"
  | "pump-dump"
  | "over-under"
  | "liquidations"
  | "signals"
  | "settings";

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
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "ath-atl", label: "ATH / ATL", icon: "trophy" },
  { id: "pump-dump", label: "Pump / Dump", icon: "zap" },
  { id: "over-under", label: "Over / Under", icon: "bar" },
  { id: "liquidations", label: "Liquidations", icon: "activity" },
  { id: "signals", label: "Signals", icon: "radio" },
  { id: "settings", label: "Settings", icon: "settings" },
];

export const LIQ_TIMEFRAMES = [
  "1m", "5m", "10m", "15m", "1h", "4h", "12h", "24h", "7d", "14d", "30d",
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
  agreementPct: number;
  agreementSamples: number;
  predictedPump: boolean;
  predictedDump: boolean;
}

export interface CoinDetailExtra {
  overvalued?: OvervaluedUndervaluedResult;
  signals?: unknown;
  liq?: LiqSignal;
}
