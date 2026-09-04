export type Exchange = "binance" | "okx" | "bybit";

export interface LiquidationEvent {
  id: string;
  ts: number;
  symbol: string;
  exchange: Exchange;
  side: "long" | "short";
  qty: number;
  price: number;
  usdValue: number;
}

export interface LiquidationAgg {
  symbol: string;
  longUsd: number;
  shortUsd: number;
  total: number;
  longPct: number;
  shortPct: number;
}

export interface MarketGlanceGroup {
  shortDominant: LiquidationAgg[];
  longDominant: LiquidationAgg[];
  mixed: LiquidationAgg[];
}

export interface SweepRecord {
  id: string;
  symbol: string;
  side: "long" | "short";
  totalUsd: number;
  count: number;
  priceStart: number;
  priceEnd: number;
  priceMove: number;
  duration: number;
  startTime: number;
  endTime: number;
}

export interface MatrixCell {
  symbol: string;
  bucketIndex: number;
  bucketStart: number;
  bucketEnd: number;
  dominantSide: "long" | "short" | "neutral";
  longUsd: number;
  shortUsd: number;
  totalUsd: number;
  intensity: number;
}

export type LiqTab = "realtime" | "history" | "matrix" | "sweeps";

export type HistoryTimeframe = "5m" | "15m" | "1h" | "4h" | "12h" | "1d" | "1w";

export interface LiqFilters {
  side: "long" | "short" | "both";
  exchanges: Exchange[];
  symbolSearch: string;
  minUsd: number;
}

export interface LiquidationStore {
  events: LiquidationEvent[];
  glanceWindow: number;
  activeTab: LiqTab;
  historyTimeframe: HistoryTimeframe;
  isPaused: boolean;
  filters: LiqFilters;
  queuedEvents: LiquidationEvent[];
  addEvent: (event: LiquidationEvent) => void;
  addEvents: (events: LiquidationEvent[]) => void;
  setGlanceWindow: (ms: number) => void;
  setActiveTab: (tab: LiqTab) => void;
  setHistoryTimeframe: (tf: HistoryTimeframe) => void;
  togglePaused: () => void;
  setFilters: (filters: Partial<LiqFilters>) => void;
  flushQueued: () => void;
}

export const DOMINANCE_THRESHOLD = 0.8;

export const SWEEP_WINDOW_MS = 60_000;
export const SWEEP_PRICE_BAND_PCT = 0.5;
export const SWEEP_MIN_EVENTS = 3;

export const EVENT_BUFFER_CAP = 2000;

export const GLANCE_WINDOWS: { label: string; ms: number }[] = [
  { label: "5m", ms: 5 * 60 * 1000 },
  { label: "15m", ms: 15 * 60 * 1000 },
  { label: "1h", ms: 60 * 60 * 1000 },
  { label: "4h", ms: 4 * 60 * 60 * 1000 },
  { label: "1d", ms: 24 * 60 * 60 * 1000 },
];

export const TIMEFRAME_MS: Record<HistoryTimeframe, number> = {
  "5m": 5 * 60 * 1000,
  "15m": 15 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "4h": 4 * 60 * 60 * 1000,
  "12h": 12 * 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
  "1w": 7 * 24 * 60 * 60 * 1000,
};

export const BinanceRawLiq = {} as Record<string, unknown>;
export const OKXRawLiq = {} as Record<string, unknown>;
