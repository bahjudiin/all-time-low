// ── Prediction State Machine ────────────────────────────────────────

export type PredictionState =
  | "normal"
  | "move_detected"
  | "accelerating"
  | "extended"
  | "exhaustion_building"
  | "target_forming"
  | "limit_zone"
  | "extreme"
  | "touched"
  | "reversing"
  | "complete"
  | "invalidated"
  | "cooldown";

export type PredictionDirection = "LONG" | "SHORT";

export type PredictionQuality = "A+" | "A" | "B" | "C" | "WATCH";

export type ApproachState = "FAR" | "APPROACHING" | "NEAR" | "TOUCHING" | "TOUCHED" | "REVERSING" | "INVALIDATED";

// ── Factor Analysis Types ───────────────────────────────────────────

export interface PriceExtension {
  ret1m: number;
  ret3m: number;
  ret5m: number;
  ret15m: number;
  ret30m: number;
  ret1h: number;
  moveFromLocalLow: number;
  moveFromLocalHigh: number;
  abnormalMove: boolean;
  extensionPercentile: number;
}

export interface VolatilityAnalysis {
  atr: number;
  atrNormalized: number;
  atrExpansion: number;
  rangeExpansion: number;
  volatilityPercentile: number;
  moveOverATR: number;
  abnormalVolatility: boolean;
}

export interface MomentumAnalysis {
  rsi: number;
  rsiExtreme: boolean;
  rsiAcceleration: number;
  rsiDeceleration: boolean;
  stochRsiK: number;
  stochRsiD: number;
  rateOfChange: number;
  priceAcceleration: number;
  priceDeceleration: boolean;
}

export interface VolumeAnalysis {
  volumeZScore: number;
  volumeClimax: boolean;
  volumeIncreasingWithPrice: boolean;
  volumeDecliningWhileExtending: boolean;
  priceVolumeDivergence: boolean;
  currentVolume: number;
  averageVolume: number;
}

export interface OrderFlowAnalysis {
  buySellImbalance: number;
  aggressiveBuyVolume: number;
  aggressiveSellVolume: number;
  delta: number;
  deltaChange: number;
  absorptionDetected: boolean;
  weakeningAggression: boolean;
  available: boolean;
}

export interface VWAPAnalysis {
  vwap: number;
  distanceFromVwap: number;
  vwapDeviation: number;
  extendedFromVwap: boolean;
}

export interface SwingPoint {
  price: number;
  index: number;
  type: "high" | "low";
}

export interface MarketStructureAnalysis {
  localHighs: SwingPoint[];
  localLows: SwingPoint[];
  previousSwingHigh: number;
  previousSwingLow: number;
  breakout: boolean;
  failedBreakout: boolean;
  resistanceLevels: number[];
  supportLevels: number[];
  higherHighExhaustion: boolean;
  lowerLowExhaustion: boolean;
  structureCompression: boolean;
}

export interface LiquidityAnalysis {
  nearbyLiquidationClusters: number[];
  recentLiquidationEvents: number;
  potentialLiquiditySweep: boolean;
  available: boolean;
}

// ── Prediction Output Types ─────────────────────────────────────────

export interface ExhaustionFactors {
  priceExtension: PriceExtension;
  volatility: VolatilityAnalysis;
  momentum: MomentumAnalysis;
  volume: VolumeAnalysis;
  orderFlow: OrderFlowAnalysis;
  vwap: VWAPAnalysis;
  marketStructure: MarketStructureAnalysis;
  liquidity: LiquidityAnalysis;
}

export interface PredictionZone {
  upper: number;
  lower: number;
}

export interface LimitLevels {
  l1: number;
  l2: number;
  l3: number;
}

export interface ClusterVoteInfo {
  name: string;
  vote: -1 | 0 | 1;
  confidence: number;
  factors: string[];
}

export interface CoinPrediction {
  symbol: string;
  name: string;
  image: string;
  currentPrice: number;
  direction: PredictionDirection;
  state: PredictionState;
  quality: PredictionQuality;
  movePercent: number;

  predictedZone: PredictionZone;
  limitLevels: LimitLevels;
  invalidation: number;
  projectedMove: number;
  expectedReversalArea: number;

  continuationProbability: number;
  exhaustionProbability: number;
  zoneReachProbability: number;

  approachState: ApproachState;
  distanceToZone: number;
  distanceToZonePct: number;

  factors: ExhaustionFactors;
  clusterVotes: ClusterVoteInfo[];
  agreeingClusters: number;
  conflictingClusters: number;
  supportingFactors: string[];
  warningFactors: string[];

  lastUpdate: number;
  exchangeSource: string;
}

// ── History Types ───────────────────────────────────────────────────

export interface PredictionRecord {
  id: string;
  symbol: string;
  timestamp: number;
  direction: PredictionDirection;
  currentPrice: number;
  predictedZone: PredictionZone;
  limitLevels: LimitLevels;
  invalidation: number;
  continuationProbability: number;
  exhaustionProbability: number;
  reachProbability: number;
  quality: PredictionQuality;
  factors: ExhaustionFactors;
  zoneTouched: boolean;
  maxExtensionAfterPrediction: number;
  reversalAfterTouch: boolean;
  invalidated: boolean;
  finalResult: "touched_reversal" | "touched_continuation" | "invalidated" | "pending";
}

// ── Summary Stats ───────────────────────────────────────────────────

export interface PredictionSummary {
  activePredictions: number;
  strongExhaustion: number;
  shortZones: number;
  longZones: number;
  zonesApproaching: number;
  zonesTouched: number;
  winRate: number;
  totalHistory: number;
}

// ── Store Types ─────────────────────────────────────────────────────

export type PredictionSortColumn =
  | "symbol"
  | "movePercent"
  | "state"
  | "currentPrice"
  | "distanceToZonePct"
  | "zoneReachProbability"
  | "exhaustionProbability"
  | "continuationProbability"
  | "quality";

export interface PredictionFilters {
  direction: "all" | "LONG" | "SHORT";
  quality: "all" | "A+" | "A" | "B" | "C" | "WATCH";
  state: "all" | PredictionState;
  minExhaustion: number;
}

export interface PredictionStoreState {
  predictions: CoinPrediction[];
  selectedSymbol: string | null;
  filters: PredictionFilters;
  sortColumn: PredictionSortColumn;
  sortDirection: "asc" | "desc";
  history: PredictionRecord[];
  isScanning: boolean;
  lastScanTime: number;
  setPredictions: (predictions: CoinPrediction[]) => void;
  updatePrediction: (symbol: string, update: Partial<CoinPrediction>) => void;
  setSelectedSymbol: (symbol: string | null) => void;
  setFilters: (filters: Partial<PredictionFilters>) => void;
  setSort: (column: PredictionSortColumn, direction: "asc" | "desc") => void;
  addHistoryRecord: (record: PredictionRecord) => void;
  setScanning: (scanning: boolean) => void;
}
