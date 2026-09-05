// ── Indicator Result Types ──────────────────────────────────────────

export interface RSIResult {
  value: number;
  signal: -1 | 0 | 1;
  label: string;
}

export interface StochRSIResult {
  k: number;
  d: number;
  signal: -1 | 0 | 1;
  label: string;
}

export interface EMAResult {
  fast: number;
  slow: number;
  crossover: "bullish" | "bearish" | "none";
  signal: -1 | 0 | 1;
  label: string;
}

export interface MACDResult {
  macd: number;
  signalLine: number;
  histogram: number;
  crossover: "bullish" | "bearish" | "none";
  signal: -1 | 0 | 1;
  label: string;
}

export interface ADXResult {
  adx: number;
  plusDI: number;
  minusDI: number;
  trendStrength: "strong" | "moderate" | "weak" | "none";
  signal: -1 | 0 | 1;
  label: string;
}

export interface BollingerResult {
  upper: number;
  middle: number;
  lower: number;
  position: "above_upper" | "near_upper" | "middle" | "near_lower" | "below_lower";
  bandwidth: number;
  signal: -1 | 0 | 1;
  label: string;
}

export interface CCIResult {
  value: number;
  signal: -1 | 0 | 1;
  label: string;
}

export interface ATRResult {
  value: number;
  normalizedPct: number;
  volatilityRegime: "high" | "normal" | "low";
  label: string;
}

export interface OBVResult {
  current: number;
  previous: number;
  trend: "rising" | "falling" | "flat";
  divergence: "bullish" | "bearish" | "none";
  signal: -1 | 0 | 1;
  label: string;
}

// ── ATH/ATL Indicator Types ───────────────────────────────────────

export interface ATHATLResult {
  athPrice: number;
  athChangePct: number;
  athDate: string;
  atlPrice: number;
  atlChangePct: number;
  atlDate: string;
  distanceFromATH: number;
  distanceFromATL: number;
  midRangePct: number;
  signal: -1 | 0 | 1;
  label: string;
}

// ── Derivatives Indicator Types ────────────────────────────────────

export interface FundingRateResult {
  current: number;
  average8h: number;
  average24h: number;
  trend: "increasing" | "decreasing" | "stable";
  signal: -1 | 0 | 1;
  label: string;
}

export interface OpenInterestResult {
  current: number;
  change24hPct: number;
  change7dPct: number;
  trend: "increasing" | "decreasing" | "stable";
  signal: -1 | 0 | 1;
  label: string;
}

export interface LongShortRatioResult {
  global: number;
  topAccount: number;
  topPosition: number;
  takerRatio: number;
  crowdBias: "long" | "short" | "neutral";
  whaleBias: "long" | "short" | "neutral";
  aggressorBias: "long" | "short" | "neutral";
  signal: -1 | 0 | 1;
  label: string;
}

// ── Indicator Group Types ──────────────────────────────────────────

export interface IndicatorGroup {
  name: string;
  signal: -1 | 0 | 1;
  indicators: { name: string; value: string; signal: -1 | 0 | 1 }[];
  agreed: boolean;
}

// ── Price Target Types ─────────────────────────────────────────────

export interface PriceLevel {
  price: number;
  distance: number;   // % from current
  source: string;     // e.g. "Bollinger Upper", "ATR Extension"
}

export interface PriceTargets {
  l1: PriceLevel;     // Conservative — nearest level
  l2: PriceLevel;     // Moderate — extension target
  l3: PriceLevel;     // Aggressive — ATH/ATL or major level
  invalidation: number; // Stop level
}

// ── Composite Signal Types ─────────────────────────────────────────

export type SignalDirection = "strong_long" | "long" | "lean_long" | "wait" | "lean_short" | "short" | "strong_short";

export interface CoinSignals {
  momentum: IndicatorGroup;
  trend: IndicatorGroup;
  marketStructure: IndicatorGroup;
  crowdSentiment: IndicatorGroup;
  volumeFlow: IndicatorGroup;
  confirmation: IndicatorGroup;
  athAtlPosition: IndicatorGroup;
  score: number;
  maxScore: number;
  direction: SignalDirection;
  agreementPct: number;
  athAtl?: ATHATLResult;
  priceTargets?: PriceTargets;
}

export interface BinanceKline {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
  quoteVolume: number;
  trades: number;
}

export interface BinanceFundingRate {
  symbol: string;
  fundingRate: number;
  fundingTime: number;
}

export interface BinanceOpenInterest {
  current: string;
  symbol: string;
  time: number;
}

export interface BinanceLongShortRatio {
  symbol: string;
  longShortRatio: string;
  longAccount: string;
  shortAccount: string;
  timestamp: number;
}
