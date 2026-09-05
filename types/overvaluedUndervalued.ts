export interface OvervaluationData {
  overvaluationScore: number; // 0-100
  fairValueDeviation: number; // percentage deviation from VWAP/EMA
  rsi15m: number;
  rsi1h: number;
  rsi4h: number;
  momentumExhaustion: number; // 0-100
  consensus: "overbought" | "neutral" | "oversold";
}

export interface CrowdingData {
  fundingRate: number; // percentage
  fundingPercentile: number; // 0-100
  openInterestChange24h: number; // percentage
  priceOiRelationship: "converging" | "diverging" | "neutral";
  longShortRatio: number;
}

export interface VolumeData {
  volumeRatio: number; // current / rolling average
  volumeClimax: boolean;
  priceVolumeDivergence: "bullish" | "bearish" | "none";
}

export interface VolatilityData {
  bbPosition: number; // 0-1, near 1 = upper extreme, near 0 = lower extreme
  atrNormalized: number; // percentage
  volatilityPercentile: number; // 0-100
}

export interface StructureData {
  trend: "range" | "uptrend" | "downtrend" | "breakout" | "squeeze" | "capitulation";
  higherHighExhaustion: boolean;
  lowerLowExhaustion: boolean;
  failedBreakout: boolean;
  failedBreakdown: boolean;
  microStructure: "higher highs" | "lower lows" | "sideways" | "chaotic";
}

export interface LiquidationData {
  shortLiquidations24h: number; // dollar value
  longLiquidations24h: number; // dollar value
  liquidationImbalance: "long" | "short" | "neutral";
  nearbyLiquidationClusters: boolean;
}

export interface RegimeData {
  regime: "RANGE" | "TRENDING_UP" | "TRENDING_DOWN" | "BREAKOUT" | "SQUEEZE" | "CAPITULATION";
  regimeStrength: number; // 0-100
}

export interface PredictionInputs {
  reversalProbability: number; // 0-100
  continuationProbability: number; // 0-100
  confidence: number; // 0-100 (raw, before conflict penalty)
  conflictScore: number; // 0-100
  finalConfidence: number; // raw × (1 - conflict/100)
  marketRegime: RegimeData;
}

export interface LimitEntry {
  predictedEntry: number; // price
  entryZoneLower: number;
  entryZoneUpper: number;
  invalidation: number;
  t1Target: number;
  t2Target: number;
  t3Target: number;
  expectedRewardRisk: number; // R:R ratio
}

export interface OpportunityData {
  opportunityScore: number; // 0-100
  valuationSeverity: "mild" | "moderate" | "extreme";
  reasons: string[];
  dataQuality: number; // 0-100
}

export interface OvervaluedUndervaluedCoin {
  // Core identification
  symbol: string;
  name: string;
  image: string;
  currentPrice: number;

  // Valuation scores
  overvaluationScore: number; // 0-100 (high = overvalued)
  undervaluationScore: number; // 0-100 (high = undervalued)
  // Only one should be high at a time

  // Probabilities
  reversalProbability: number; // 0-100
  continuationProbability: number; // 0-100

  // Signal state
  signalState: "NEUTRAL" | "WATCHING" | "STRETCHED" | "EXTREME" | "WAITING_FOR_ENTRY" | "ENTRY_NEAR" | "ENTRY_TOUCHED" | "REVERSAL_CONFIRMING" | "ACTIVE" | "INVALIDATED" | "TARGET_REACHED" | "EXPIRED";

  // Limit entry
  limitEntry: LimitEntry;

  // Opportunity score
  opportunityScore: number; // 0-100

  // Contributing factors/data
  overvaluationData: OvervaluationData;
  crowdingData: CrowdingData;
  volumeData: VolumeData;
  volatilityData: VolatilityData;
  structureData: StructureData;
  liquidationData: LiquidationData;
  regimeData: RegimeData;

  // Quality
  dataQuality: number; // 0-100

  // Timing
  lastUpdate: number;
}