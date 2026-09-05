import type {
  BinanceKline,
  BinanceFundingRate,
  BinanceLongShortRatio,
  BinanceOpenInterest,
} from "@/types/signal";
import { calcRSI, calcBollinger, calcATR } from "@/lib/indicators";

// ── Helpers ─────────────────────────────────────────────────────────

function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    if (isNaN(result[i - 1])) {
      result.push(values[i]);
    } else {
      result.push(values[i] * k + result[i - 1] * (1 - k));
    }
  }
  return result;
}

function percentile(value: number, values: number[]): number {
  const valid = values.filter((v) => isFinite(v));
  if (valid.length === 0) return 50;
  const sorted = [...valid].sort((a, b) => a - b);
  let count = 0;
  for (const v of sorted) if (v <= value) count++;
  return (count / sorted.length) * 100;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function round(v: number, digits = 2): number {
  const f = Math.pow(10, digits);
  return Math.round(v * f) / f;
}

function calcVWAP(klines: BinanceKline[]): number {
  let cumTPV = 0;
  let cumVol = 0;
  for (const k of klines) {
    const tp = (k.high + k.low + k.close) / 3;
    cumTPV += tp * k.volume;
    cumVol += k.volume;
  }
  return cumVol === 0 ? (klines[klines.length - 1]?.close ?? 0) : cumTPV / cumVol;
}

function findSwingPoints(klines: BinanceKline[], lookback = 5): { price: number; index: number; type: "high" | "low" }[] {
  const swings: { price: number; index: number; type: "high" | "low" }[] = [];
  for (let i = lookback; i < klines.length - lookback; i++) {
    let isHigh = true;
    let isLow = true;
    for (let j = 1; j <= lookback; j++) {
      if (klines[i].high <= klines[i - j].high || klines[i].high <= klines[i + j].high) isHigh = false;
      if (klines[i].low >= klines[i - j].low || klines[i].low >= klines[i + j].low) isLow = false;
    }
    if (isHigh) swings.push({ price: klines[i].high, index: i, type: "high" });
    if (isLow) swings.push({ price: klines[i].low, index: i, type: "low" });
  }
  return swings;
}

// ── Input type ──────────────────────────────────────────────────────

export interface OvervaluedUndervaluedInput {
  symbol: string;
  name: string;
  image: string;
  currentPrice: number;
  klines15m: BinanceKline[];
  klines1h: BinanceKline[];
  klines4h: BinanceKline[];
  fundingRates: BinanceFundingRate[];
  openInterest: BinanceOpenInterest | null;
  longShort: {
    global: BinanceLongShortRatio[];
    topAccount: BinanceLongShortRatio[];
    topPosition: BinanceLongShortRatio[];
    taker: BinanceLongShortRatio[];
  };
  liquidationDataAvailable: boolean;
  futuresVolume24h: number;
}

// ── Group 1: Fair Value Deviation (25%) ────────────────────────────

interface FairValueDeviationFactor {
  vwapDeviation15m: number;
  vwapDeviation1h: number;
  vwapDeviation24h: number;
  ema50Deviation1h: number;
  ema200Deviation1h: number;
  combinedDeviation: number;
  score: number; // 0-100, >50 = overvalued stretched
  direction: number; // +1 = stretched up, -1 = stretched down
}

function computeFairValueDeviation(
  currentPrice: number,
  klines15m: BinanceKline[],
  klines1h: BinanceKline[],
): FairValueDeviationFactor {
  const vwap15m = calcVWAP(klines15m);
  const vwap1h = calcVWAP(klines1h);

  const closes1h = klines1h.map((k) => k.close);
  const ema50 = ema(closes1h, 50);
  const ema200 = ema(closes1h, 200);
  const ema50Val = ema50[ema50.length - 1];
  const ema200Val = ema200[ema200.length - 1];

  const vwap24h = klines1h.length >= 24
    ? calcVWAP(klines1h.slice(-24))
    : vwap1h;

  const dev = (ref: number) => (ref === 0 ? 0 : ((currentPrice - ref) / ref) * 100);

  const d15m = dev(vwap15m);
  const d1h = dev(vwap1h);
  const d24h = dev(vwap24h);
  const d50 = isFinite(ema50Val) ? dev(ema50Val) : 0;
  const d200 = isFinite(ema200Val) ? dev(ema200Val) : 0;

  // Weighted combined deviation (higher TF devs matter more for valuation)
  const combined = d15m * 0.15 + d1h * 0.25 + d24h * 0.25 + d50 * 0.2 + d200 * 0.15;

  const direction = combined >= 0 ? 1 : -1;
  const abs = Math.abs(combined);

  // Map to 0-100 score: 4% = neutral boundary, 15%+ = extreme
  const score = clamp(abs / 0.12 * 100, 0, 100);

  return {
    vwapDeviation15m: round(d15m),
    vwapDeviation1h: round(d1h),
    vwapDeviation24h: round(d24h),
    ema50Deviation1h: round(d50),
    ema200Deviation1h: round(d200),
    combinedDeviation: round(combined),
    score,
    direction,
  };
}

// ── Group 2: Momentum Exhaustion (15%) ─────────────────────────────

interface MomentumFactor {
  rsi15m: number;
  rsi1h: number;
  rsi4h: number;
  weightedRsi: number;
  score: number; // 0-100
  direction: number; // +1 = overbought stretch, -1 = oversold stretch
}

function computeMomentum(
  klines15m: BinanceKline[],
  klines1h: BinanceKline[],
  klines4h: BinanceKline[],
): MomentumFactor {
  const rsi15m = calcRSI(klines15m.map((k) => k.close)).value;
  const rsi1h = calcRSI(klines1h.map((k) => k.close)).value;
  const rsi4h = calcRSI(klines4h.map((k) => k.close)).value;

  // 15m=20%, 1H=40%, 4H=40%
  const weighted = rsi15m * 0.2 + rsi1h * 0.4 + rsi4h * 0.4;

  // Score: distance from 50, multi-timeframe agreement boosts
  const direction = weighted >= 50 ? 1 : -1;

  let score = 0;
  if (direction === 1) {
    // Overbought range 50-100
    const overboughtLevel = 70;
    const extremeLevel = 80;
    score = clamp(((weighted - 50) / (extremeLevel - 50)) * 100, 0, 100);
    // Timeframe agreement bonus
    const tfAgree = [rsi15m, rsi1h, rsi4h].filter((r) => r > 65).length;
    if (tfAgree >= 2) score = clamp(score + 10, 0, 100);
    if (tfAgree >= 3) score = clamp(score + 5, 0, 100);
  } else {
    const oversoldLevel = 30;
    const extremeLevel = 20;
    score = clamp(((50 - weighted) / (50 - extremeLevel)) * 100, 0, 100);
    const tfAgree = [rsi15m, rsi1h, rsi4h].filter((r) => r < 35).length;
    if (tfAgree >= 2) score = clamp(score + 10, 0, 100);
    if (tfAgree >= 3) score = clamp(score + 5, 0, 100);
  }

  return {
    rsi15m: round(rsi15m, 1),
    rsi1h: round(rsi1h, 1),
    rsi4h: round(rsi4h, 1),
    weightedRsi: round(weighted, 1),
    score,
    direction,
  };
}

// ── Group 3: Futures Crowding (20%) ────────────────────────────────

interface CrowdingFactor {
  fundingRate: number;
  fundingPercentile: number;
  oiChange1hPct: number;
  priceOiRelationship: "expanding-longs" | "short-covering" | "expanding-shorts" | "long-covering" | "neutral";
  longShortRatio: number;
  score: number;
  direction: number;
}

function computeFuturesCrowding(
  currentPrice: number,
  fundingRates: BinanceFundingRate[],
  openInterest: BinanceOpenInterest | null,
  longShort: OvervaluedUndervaluedInput["longShort"],
  priceChange1hPct: number,
): CrowdingFactor {
  const currentRate = fundingRates.length > 0 ? fundingRates[fundingRates.length - 1].fundingRate : 0;
  const rates30d = fundingRates.slice(-90).map((f) => f.fundingRate);
  const fundingPct = percentile(currentRate, rates30d);

  let oiChange1h = 0;
  if (openInterest && openInterest.current) {
    const oiNow = parseFloat(openInterest.current);
    // Use price change as proxy for OI delta without historical OI sample
    oiChange1h = oiNow > 0 ? priceChange1hPct : 0;
  }

  const globalRatio = longShort.global.length > 0
    ? parseFloat(longShort.global[longShort.global.length - 1].longShortRatio)
    : 1;

  // Price/OI relationship
  let priceOi: CrowdingFactor["priceOiRelationship"] = "neutral";
  const priceUp = priceChange1hPct > 0.3;
  const priceDown = priceChange1hPct < -0.3;
  const crowdingUp = oiChange1h > 3;
  const crowdingDown = oiChange1h < -3;
  const fundingPos = currentRate > 0.0001;
  const fundingNeg = currentRate < -0.0001;

  if (priceUp && (crowdingUp || fundingPos)) priceOi = "expanding-longs";
  else if (priceUp && crowdingDown) priceOi = "short-covering";
  else if (priceDown && (crowdingUp || fundingNeg)) priceOi = "expanding-shorts";
  else if (priceDown && crowdingDown) priceOi = "long-covering";

  // Crowding score: high positive funding percentile + OI expansion + long-heavy ratio = crowded longs
  let score = 0;
  let direction = 0;

  if (priceOi === "expanding-longs") {
    score = clamp(fundingPct * 0.5 + 35 + (globalRatio > 1.2 ? 15 : 0), 0, 100);
    direction = 1;
  } else if (priceOi === "expanding-shorts") {
    score = clamp((100 - fundingPct) * 0.5 + 35 + (globalRatio < 0.8 ? 15 : 0), 0, 100);
    direction = -1;
  } else if (priceOi === "short-covering") {
    score = 30;
    direction = currentRate > 0 ? 1 : -1;
  } else if (priceOi === "long-covering") {
    score = 30;
    direction = currentRate < 0 ? -1 : 1;
  } else {
    score = Math.abs(fundingPct - 50) / 2;
    direction = fundingPct > 50 ? 1 : fundingPct < 50 ? -1 : 0;
  }

  return {
    fundingRate: round(currentRate * 100, 4),
    fundingPercentile: round(fundingPct),
    oiChange1hPct: round(oiChange1h),
    priceOiRelationship: priceOi,
    longShortRatio: round(globalRatio, 2),
    score,
    direction,
  };
}

// ── Group 4: Volume Participation (10%) ────────────────────────────

interface VolumeFactor {
  volumeRatio: number;
  score: number;
  direction: number;
}

function computeVolume(
  klines15m: BinanceKline[],
  priceUp: boolean,
): VolumeFactor {
  const volumes = klines15m.map((k) => k.volume);
  if (volumes.length === 0) return { volumeRatio: 1, score: 0, direction: 0 };
  const last = volumes[volumes.length - 1];
  const avg = volumes.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, volumes.length) || 1;
  const ratio = last / avg;

  const direction = priceUp ? 1 : -1;
  const score = clamp((ratio - 1) * 30, 0, 100);

  return { volumeRatio: round(ratio, 1), score, direction };
}

// ── Group 5: Volatility Position (10%) ─────────────────────────────

interface VolatilityFactor {
  bbPosition: number; // 0-1
  atrNormalized: number;
  volatilityPercentile: number;
  score: number;
  direction: number;
}

function computeVolatility(
  currentPrice: number,
  klines1h: BinanceKline[],
): VolatilityFactor {
  const closes = klines1h.map((k) => k.close);
  const bb = calcBollinger(closes);
  const atr = calcATR(klines1h);

  // BB position: 0 (lower extreme) to 1 (upper extreme)
  let bbPos = 0.5;
  if (bb.upper > bb.lower) {
    bbPos = clamp((closes[closes.length - 1] - bb.lower) / (bb.upper - bb.lower), 0, 1);
  }

  // ATR normalized + percentile
  const tr = klines1h.map((k, i) => {
    if (i === 0) return k.high - k.low;
    const pc = klines1h[i - 1].close;
    return Math.max(k.high - k.low, Math.abs(k.high - pc), Math.abs(k.low - pc));
  });
  const atrVals = ema(tr, 14);
  const atrNow = atrVals[atrVals.length - 1] || 0;
  const volPct = percentile(atrNow, atrVals.filter((v) => isFinite(v)));

  const direction = bbPos >= 0.5 ? 1 : -1;
  const score = clamp(Math.abs(bbPos - 0.5) * 2 * 100, 0, 100);

  return {
    bbPosition: round(bbPos, 3),
    atrNormalized: atr.normalizedPct,
    volatilityPercentile: round(volPct),
    score,
    direction,
  };
}

// ── Group 6: Market Structure (10%) ────────────────────────────────

interface StructureFactor {
  localHigh: number;
  localLow: number;
  failedBreakout: boolean;
  failedBreakdown: boolean;
  lowerHigh: boolean;
  higherLow: boolean;
  breakout: boolean;
  score: number;
  direction: number;
}

function computeMarketStructure(
  currentPrice: number,
  klines4h: BinanceKline[],
): StructureFactor {
  const swings = findSwingPoints(klines4h, 3);
  const highs = swings.filter((s) => s.type === "high").sort((a, b) => b.index - a.index);
  const lows = swings.filter((s) => s.type === "low").sort((a, b) => b.index - a.index);

  const prevHigh = highs.length > 0 ? highs[0].price : currentPrice * 1.02;
  const prevLow = lows.length > 0 ? lows[0].price : currentPrice * 0.98;

  const recentHigh = Math.max(...klines4h.slice(-3).map((k) => k.high));
  const recentLow = Math.min(...klines4h.slice(-3).map((k) => k.low));

  const breakout = currentPrice > prevHigh;
  const failedBreakout = recentHigh > prevHigh && currentPrice <= prevHigh;
  const lowerHigh = highs.length >= 2 && highs[0].price < highs[1].price;
  const failedBreakdown = recentLow < prevLow && currentPrice >= prevLow;
  const higherLow = lows.length >= 2 && lows[0].price > lows[1].price;

  // Structure is a secondary confirmer — score reflects reversal structure present
  let score = 0;
  let direction = 0;
  if (failedBreakout || lowerHigh) {
    score = 70;
    direction = 1; // overvalued reversal setup
  } else if (failedBreakdown || higherLow) {
    score = 70;
    direction = -1; // undervalued reversal setup
  } else if (breakout) {
    score = 20;
    direction = 1;
  }

  return {
    localHigh: round(prevHigh),
    localLow: round(prevLow),
    failedBreakout,
    failedBreakdown,
    lowerHigh,
    higherLow,
    breakout,
    score,
    direction,
  };
}

// ── Group 7: Liquidation Pressure (10%) ────────────────────────────

interface LiquidationFactor {
  observedLiquidations: boolean;
  score: number;
  direction: number;
}

function computeLiquidation(
  liquidationDataAvailable: boolean,
  priceUp: boolean,
): LiquidationFactor {
  if (!liquidationDataAvailable) {
    // Graceful degradation: use volume+extension proxy (low confidence)
    return { observedLiquidations: false, score: 30, direction: priceUp ? 1 : -1 };
  }
  // When available, high extreme + priceUp tends to indicate squeeze exhaustion
  return { observedLiquidations: true, score: 65, direction: priceUp ? 1 : -1 };
}

// ── Market Regime ──────────────────────────────────────────────────

export type MarketRegime =
  | "RANGE"
  | "TRENDING_UP"
  | "TRENDING_DOWN"
  | "BREAKOUT"
  | "SQUEEZE"
  | "CAPITULATION"
  | "HIGH_VOLATILITY";

function classifyRegime(
  priceChange24h: number,
  priceChange1h: number,
  atrNormalized: number,
  structure: StructureFactor,
): MarketRegime {
  if (structure.breakout && Math.abs(priceChange24h) > 8) return "BREAKOUT";
  if (atrNormalized > 6 && Math.abs(priceChange24h) > 15) return "CAPITULATION";
  if (atrNormalized > 4) return "HIGH_VOLATILITY";
  if (priceChange24h > 6) return "TRENDING_UP";
  if (priceChange24h < -6) return "TRENDING_DOWN";
  if (Math.abs(priceChange24h) < 2 && atrNormalized < 1.5) return "SQUEEZE";
  return "RANGE";
}

// ── Conflict Engine ────────────────────────────────────────────────

interface ConflictResult {
  conflictScore: number; // 0-100
  conflicts: string[];
}

function computeConflictScore(
  factors: {
    fairValue: FairValueDeviationFactor;
    momentum: MomentumFactor;
    crowding: CrowdingFactor;
    volume: VolumeFactor;
    volatility: VolatilityFactor;
    structure: StructureFactor;
    liquidation: LiquidationFactor;
    priceChange1hPct: number;
    priceChange24hPct: number;
  },
  direction: number, // +1 = overvalued/short thesis, -1 = undervalued/long thesis
  regime: MarketRegime,
): ConflictResult {
  const conflicts: string[] = [];
  let score = 0;

  const stretchDir = direction; // the thesis direction being evaluated

  if (stretchDir === 1) {
    // Overvalued / short thesis conflicts
    const fundingOpposes = factors.crowding.fundingRate < 0;
    if (fundingOpposes) {
      conflicts.push("Negative funding despite overvaluation");
      score += 18;
    }
    if (factors.crowding.priceOiRelationship === "short-covering") {
      conflicts.push("Overvaluation driven by short covering, not fresh longs");
      score += 15;
    }
    if (factors.structure.breakout && factors.volume.volumeRatio > 1.5) {
      conflicts.push("Clean breakout with expanding participation");
      score += 22;
    }
    if (regime === "BREAKOUT" || regime === "TRENDING_UP") {
      conflicts.push("Strong trend regime counteracts reversal");
      score += 15;
    }
    if (factors.momentum.score < 40) {
      conflicts.push("Insufficient momentum exhaustion");
      score += 10;
    }
    if (factors.volume.direction !== 1 && factors.volume.volumeRatio < 0.8) {
      conflicts.push("Falling volume during stretch — weak conviction");
      score += 8;
    }
  } else if (stretchDir === -1) {
    // Undervalued / long thesis conflicts
    const fundingOpposes = factors.crowding.fundingRate > 0;
    if (fundingOpposes) {
      conflicts.push("Positive funding despite undervaluation");
      score += 18;
    }
    if (factors.crowding.priceOiRelationship === "long-covering") {
      conflicts.push("Undervaluation driven by long covering, not fresh shorts");
      score += 15;
    }
    if (factors.structure.breakout && factors.volume.volumeRatio > 1.5) {
      conflicts.push("Strong breakdown with expanding participation");
      score += 22;
    }
    if (regime === "TRENDING_DOWN") {
      conflicts.push("Strong downtrend regime counteracts bounce");
      score += 15;
    }
    if (factors.momentum.score < 40) {
      conflicts.push("Insufficient downside exhaustion");
      score += 10;
    }
  }

  return { conflictScore: clamp(score, 0, 100), conflicts };
}

// ── Reversal / Continuation Probabilities ──────────────────────────

function computeReversalContinuation(
  factors: {
    fairValue: FairValueDeviationFactor;
    momentum: MomentumFactor;
    crowding: CrowdingFactor;
    volume: VolumeFactor;
    volatility: VolatilityFactor;
    structure: StructureFactor;
    liquidation: LiquidationFactor;
  },
  direction: number,
  regime: MarketRegime,
): { reversal: number; continuation: number } {
  // Reversal probability basis from independent factor groups
  const groupsAgreeing = [
    factors.fairValue.direction === direction ? factors.fairValue.score * 0.9 : 0,
    factors.momentum.direction === direction ? factors.momentum.score : 0,
    factors.crowding.direction === direction ? factors.crowding.score : 0,
    factors.structure.direction === direction ? factors.structure.score : 0,
    factors.volatility.direction === direction ? factors.volatility.score : 0,
    factors.liquidation.direction === direction ? factors.liquidation.score * 0.8 : 0,
  ];

  const weightedAgree = groupsAgreeing.reduce((a, b) => a + b, 0) / 6;

  // Regime adjustment
  let regimeAdj = 0;
  if (direction === 1) {
    if (regime === "RANGE" || regime === "SQUEEZE" || regime === "CAPITULATION") regimeAdj += 15;
    if (regime === "BREAKOUT" || regime === "TRENDING_UP") regimeAdj -= 20;
  } else {
    if (regime === "RANGE" || regime === "SQUEEZE" || regime === "CAPITULATION") regimeAdj += 15;
    if (regime === "TRENDING_DOWN") regimeAdj -= 20;
  }

  // Structure confirmation boosts reversal significantly
  const structureConfirmation = factors.structure.failedBreakout || factors.structure.failedBreakdown
    ? 15
    : factors.structure.lowerHigh || factors.structure.higherLow
    ? 10
    : 0;

  const reversalRaw = weightedAgree + regimeAdj + structureConfirmation;
  const reversal = clamp(reversalRaw, 0, 100);

  // Continuation probability: complementary but not exact inverse
  const continuationBasis = [
    regime === "BREAKOUT" || regime === "TRENDING_UP" || regime === "TRENDING_DOWN" ? 25 : 5,
    factors.volume.volumeRatio > 1.2 && Math.abs(factors.volume.direction) === 1 ? 20 : 5,
    factors.structure.breakout && !factors.structure.failedBreakout ? 15 : 5,
    factors.momentum.score < 60 ? 10 : 0,
  ].reduce((a, b) => a + b, 0);

  const continuation = clamp(100 - reversal * 0.55 + continuationBasis * 0.3, 0, 100);

  return {
    reversal: round(reversal),
    continuation: round(continuation),
  };
}

// ── Entry Prediction ───────────────────────────────────────────────

interface EntryResult {
  predictedEntry: number;
  entryZoneLower: number;
  entryZoneUpper: number;
  invalidation: number;
  t1Target: number;
  t2Target: number;
  t3Target: number;
  expectedRewardRisk: number;
  entryQuality: number;
  distanceToEntryPct: number;
}

function computeEntry(
  currentPrice: number,
  direction: number,
  factors: {
    fairValue: FairValueDeviationFactor;
    volatility: VolatilityFactor;
    structure: StructureFactor;
  },
  reversalProb: number,
): EntryResult {
  const atr = Math.max(currentPrice * (factors.volatility.atrNormalized / 100), currentPrice * 0.002);

  // Entry projected as continuation of the stretch by ATR-multiple
  const extensionMultiplier = direction === 1
    ? clamp(0.8 + (factors.fairValue.score / 100) * 1.2, 0.8, 2.0)
    : clamp(0.8 + (factors.fairValue.score / 100) * 1.2, 0.8, 2.0);

  let predictedEntry: number;
  if (direction === 1) {
    predictedEntry = currentPrice + atr * extensionMultiplier;
    // Prefer liquidity levels (local highs)
    const localHigh = factors.structure.localHigh;
    if (localHigh > currentPrice && localHigh <= predictedEntry * 1.05) {
      predictedEntry = localHigh; // align with liquidity sweep
    }
  } else {
    predictedEntry = currentPrice - atr * extensionMultiplier;
    const localLow = factors.structure.localLow;
    if (localLow < currentPrice && localLow >= predictedEntry * 0.95) {
      predictedEntry = localLow;
    }
  }

  // Zone width based on ATR
  const zoneWidth = atr * 0.8;
  const entryZoneLower = direction === 1 ? predictedEntry - zoneWidth * 0.4 : predictedEntry - zoneWidth * 0.6;
  const entryZoneUpper = direction === 1 ? predictedEntry + zoneWidth * 0.6 : predictedEntry + zoneWidth * 0.4;

  // Invalidation
  const invalidationBuffer = atr * 1.2;
  const invalidation = direction === 1
    ? entryZoneUpper + invalidationBuffer
    : entryZoneLower - invalidationBuffer;

  // Reversion targets: VWAP/anchor levels
  const t1Target = direction === 1 ? currentPrice - atr * 1.5 : currentPrice + atr * 1.5;
  const t2Target = direction === 1 ? currentPrice - atr * 3 : currentPrice + atr * 3;
  const t3Target = direction === 1 ? currentPrice - atr * 5 : currentPrice + atr * 5;

  // Reward/Risk to T2
  const risk = Math.abs(predictedEntry - invalidation);
  const reward = Math.abs(predictedEntry - t2Target);
  const rr = risk > 0 ? reward / risk : 0;

  // Entry quality
  const entryQuality = clamp(
    factors.volatility.score * 0.3 +
      factors.fairValue.score * 0.3 +
      reversalProb * 0.3 +
      (factors.structure.failedBreakout || factors.structure.failedBreakdown ? 10 : 0),
    0, 100,
  );

  const distanceToEntryPct = currentPrice === 0 ? 0 : ((predictedEntry - currentPrice) / currentPrice) * 100;

  return {
    predictedEntry: round(predictedEntry),
    entryZoneLower: round(entryZoneLower),
    entryZoneUpper: round(entryZoneUpper),
    invalidation: round(invalidation),
    t1Target: round(t1Target),
    t2Target: round(t2Target),
    t3Target: round(t3Target),
    expectedRewardRisk: round(rr, 1),
    entryQuality: round(entryQuality),
    distanceToEntryPct: round(distanceToEntryPct),
  };
}

// ── Signal State Machine ───────────────────────────────────────────

export type SignalState =
  | "NEUTRAL"
  | "WATCHING"
  | "STRETCHED"
  | "EXTREME"
  | "WAITING_FOR_ENTRY"
  | "ENTRY_NEAR"
  | "ENTRY_TOUCHED"
  | "INVALIDATED";

function determineState(
  currentPrice: number,
  direction: number,
  entry: EntryResult,
  overvalScore: number,
  reversalProb: number,
): SignalState {
  const priceBeyondInvalidation = direction === 1
    ? currentPrice > entry.invalidation
    : currentPrice < entry.invalidation;
  if (priceBeyondInvalidation) return "INVALIDATED";

  const priceInZone = currentPrice >= entry.entryZoneLower && currentPrice <= entry.entryZoneUpper;
  if (priceInZone) return "ENTRY_TOUCHED";

  const distPct = Math.abs(entry.distanceToEntryPct);
  const atrPct = Math.abs(entry.entryZoneUpper - entry.entryZoneLower) / currentPrice * 100;

  if (overvalScore >= 75 && reversalProb >= 65) {
    if (distPct < atrPct) return "ENTRY_NEAR";
    return "WAITING_FOR_ENTRY";
  }
  if (overvalScore >= 60) return "STRETCHED";
  if (overvalScore >= 40) return "WATCHING";
  return "NEUTRAL";
}

// ── Main Computation ───────────────────────────────────────────────

export interface OvervaluedUndervaluedResult {
  symbol: string;
  name: string;
  image: string;
  currentPrice: number;
  direction: "overvalued" | "undervalued" | "neutral";

  overvaluationScore: number;
  undervaluationScore: number;
  reversalProbability: number;
  continuationProbability: number;
  confidence: number;
  finalConfidence: number;
  conflictScore: number;
  conflicts: string[];

  marketRegime: MarketRegime;
  signalState: SignalState;

  predictedEntry: number;
  entryZoneLower: number;
  entryZoneUpper: number;
  invalidation: number;
  t1Target: number;
  t2Target: number;
  t3Target: number;
  expectedRewardRisk: number;
  entryQuality: number;
  distanceToEntryPct: number;

  opportunityScore: number;
  dataQuality: number;

  reasons: string[];

  factorWeights: {
    fairValueDeviation: number;
    momentumExhaustion: number;
    futuresCrowding: number;
    volumeParticipation: number;
    volatilityPosition: number;
    marketStructure: number;
    liquidationPressure: number;
  };

  factors: {
    fairValue: FairValueDeviationFactor;
    momentum: MomentumFactor;
    crowding: CrowdingFactor;
    volume: VolumeFactor;
    volatility: VolatilityFactor;
    structure: StructureFactor;
    liquidation: LiquidationFactor;
  };

  priceChange24hPct: number;
  lastUpdate: number;
}

export function computeOvervaluedUndervalued(
  input: OvervaluedUndervaluedInput,
): OvervaluedUndervaluedResult | null {
  const { currentPrice } = input;
  if (input.klines1h.length < 50) return null;

  const closes1h = input.klines1h.map((k) => k.close);
  const priceChange24hPct = closes1h.length >= 25
    ? ((closes1h[closes1h.length - 1] - closes1h[closes1h.length - 25]) / closes1h[closes1h.length - 25]) * 100
    : 0;
  const priceChange1hPct = closes1h.length >= 2
    ? ((closes1h[closes1h.length - 1] - closes1h[closes1h.length - 2]) / closes1h[closes1h.length - 2]) * 100
    : 0;

  const fairValue = computeFairValueDeviation(currentPrice, input.klines15m, input.klines1h);
  const momentum = computeMomentum(input.klines15m, input.klines1h, input.klines4h);
  const crowding = computeFuturesCrowding(
    currentPrice,
    input.fundingRates,
    input.openInterest,
    input.longShort,
    priceChange1hPct,
  );
  const volume = computeVolume(input.klines15m, priceChange24hPct >= 0);
  const volatility = computeVolatility(currentPrice, input.klines1h);
  const structure = computeMarketStructure(currentPrice, input.klines4h);
  const liquidation = computeLiquidation(input.liquidationDataAvailable, priceChange24hPct >= 0);

  const regime = classifyRegime(
    priceChange24hPct,
    priceChange1hPct,
    volatility.atrNormalized,
    structure,
  );

  // Thesis direction: whichever stretch is dominant
  const ovScore = fairValue.score * 0.25 + momentum.score * 0.15 + crowding.score * 0.2 +
    volume.score * 0.1 + volatility.score * 0.1 + structure.score * 0.1 + liquidation.score * 0.1;
  const directionSign = fairValue.direction !== 0 ? fairValue.direction : momentum.direction;

  let direction: OvervaluedUndervaluedResult["direction"] = "neutral";
  let valuationScore = 0;
  if (directionSign >= 1 && ovScore >= 45) {
    direction = "overvalued";
    valuationScore = ovScore;
  } else if (directionSign <= -1 && ovScore >= 45) {
    direction = "undervalued";
    valuationScore = ovScore;
  }

  const thesisDir = direction === "overvalued" ? 1 : direction === "undervalued" ? -1 : 0;

  const { reversal: reversalProbability, continuation: continuationProbability } = computeReversalContinuation(
    { fairValue, momentum, crowding, volume, volatility, structure, liquidation },
    thesisDir || 1,
    regime,
  );

  const conflict = computeConflictScore(
    {
      fairValue, momentum, crowding, volume, volatility, structure, liquidation,
      priceChange1hPct, priceChange24hPct,
    },
    thesisDir,
    regime,
  );

  const dataQuality = computeDataQuality(input);

  // Raw confidence from valuation + reversal agreement
  const rawConfidence = clamp(
    valuationScore * 0.5 + reversalProbability * 0.4 + (100 - conflict.conflictScore) * 0.1,
    0, 100,
  );
  const finalConfidence = round(rawConfidence * (1 - conflict.conflictScore / 100));

  const entry = computeEntry(
    currentPrice,
    thesisDir,
    { fairValue, volatility, structure },
    reversalProbability,
  );

  const state = determineState(
    currentPrice,
    thesisDir,
    entry,
    valuationScore,
    reversalProbability,
  );

  // Opportunity score (only meaningful for non-neutral)
  let opportunityScore = 0;
  if (direction !== "neutral") {
    const rrQuality = clamp(entry.expectedRewardRisk / 3 * 100, 0, 100);
    opportunityScore = clamp(
      (valuationScore / 100) * 0.35 +
        (reversalProbability / 100) * 0.25 +
        (entry.entryQuality / 100) * 0.15 +
        (finalConfidence / 100) * 0.15 +
        (rrQuality / 100) * 0.05 +
        (dataQuality / 100) * 0.05,
      0, 100,
    ) * 100;
  }

  const reasons = buildReasons({
    direction, valuationScore, fairValue, momentum, crowding, volume,
    volatility, structure, liquidation, regime, reversalProbability, conflict, state,
  });

  return {
    symbol: input.symbol,
    name: input.name,
    image: input.image,
    currentPrice: round(currentPrice),
    direction,
    overvaluationScore: round(direction === "overvalued" ? valuationScore : Math.max(0, Math.min(100, valuationScore))),
    undervaluationScore: round(direction === "undervalued" ? valuationScore : 0),
    reversalProbability,
    continuationProbability,
    confidence: round(rawConfidence),
    finalConfidence,
    conflictScore: conflict.conflictScore,
    conflicts: conflict.conflicts,
    marketRegime: regime,
    signalState: state,
    predictedEntry: entry.predictedEntry,
    entryZoneLower: entry.entryZoneLower,
    entryZoneUpper: entry.entryZoneUpper,
    invalidation: entry.invalidation,
    t1Target: entry.t1Target,
    t2Target: entry.t2Target,
    t3Target: entry.t3Target,
    expectedRewardRisk: entry.expectedRewardRisk,
    entryQuality: entry.entryQuality,
    distanceToEntryPct: entry.distanceToEntryPct,
    opportunityScore: round(opportunityScore),
    dataQuality,
    reasons,
    factorWeights: {
      fairValueDeviation: 25,
      momentumExhaustion: 15,
      futuresCrowding: 20,
      volumeParticipation: 10,
      volatilityPosition: 10,
      marketStructure: 10,
      liquidationPressure: 10,
    },
    factors: {
      fairValue, momentum, crowding, volume, volatility, structure, liquidation,
    },
    priceChange24hPct: round(priceChange24hPct),
    lastUpdate: Date.now(),
  };
}

// ── Data Quality ───────────────────────────────────────────────────

function computeDataQuality(input: OvervaluedUndervaluedInput): number {
  let score = 100;
  if (input.klines1h.length < 100) score -= 10;
  if (input.klines4h.length < 50) score -= 10;
  if (input.fundingRates.length === 0) score -= 15;
  if (!input.openInterest) score -= 10;
  if (!input.liquidationDataAvailable) score -= 5;
  if (input.futuresVolume24h <= 0) score -= 5;
  return clamp(score, 20, 100);
}

// ── Reasons / Explainability ───────────────────────────────────────

function buildReasons(p: {
  direction: OvervaluedUndervaluedResult["direction"];
  valuationScore: number;
  fairValue: FairValueDeviationFactor;
  momentum: MomentumFactor;
  crowding: CrowdingFactor;
  volume: VolumeFactor;
  volatility: VolatilityFactor;
  structure: StructureFactor;
  liquidation: LiquidationFactor;
  regime: MarketRegime;
  reversalProbability: number;
  conflict: ConflictResult;
  state: SignalState;
}): string[] {
  const reasons: string[] = [];
  if (p.direction === "neutral") {
    reasons.push("No significant valuation stretch");
    reasons.push(`Regime: ${p.regime}`);
    return reasons;
  }

  const dirLabel = p.direction === "overvalued" ? "overvalued" : "undervalued";

  if (p.fairValue.score > 70) reasons.push(`Price ${dirLabel} vs fair value (${p.fairValue.combinedDeviation > 0 ? "+" : ""}${p.fairValue.combinedDeviation}% deviation)`);
  else if (p.fairValue.score > 45) reasons.push(`Price stretched ${dirLabel} (${p.fairValue.combinedDeviation > 0 ? "+" : ""}${p.fairValue.combinedDeviation}%)`);

  if (p.momentum.score > 65) reasons.push(p.direction === "overvalued"
    ? `Momentum exhausted — RSI ${p.momentum.weightedRsi} multi-TF overbought`
    : `Momentum exhausted — RSI ${p.momentum.weightedRsi} multi-TF oversold`);

  if (p.crowding.score > 60) {
    if (p.direction === "overvalued") reasons.push(`Crowded longs — funding ${p.crowding.fundingRate > 0 ? "+" : ""}${p.crowding.fundingRate}% (${p.crowding.fundingPercentile}th pctile), ${p.crowding.priceOiRelationship}`);
    else reasons.push(`Crowded shorts — funding ${p.crowding.fundingPercentile}th pctile, ${p.crowding.priceOiRelationship}`);
  }

  if (p.volume.volumeRatio > 1.5) reasons.push(`Volume ${p.volume.volumeRatio}x average`);
  if (p.structure.failedBreakout) reasons.push("Failed breakout — reversal structure");
  if (p.structure.failedBreakdown) reasons.push("Failed breakdown — reversal structure");
  if (p.structure.lowerHigh) reasons.push("Lower high forming — bearish structure");
  if (p.structure.higherLow) reasons.push("Higher low forming — bullish structure");

  if (p.reversalProbability >= 65) reasons.push(`Reversal probability ${p.reversalProbability}%`);
  if (p.conflict.conflictScore > 40) reasons.push(`High conflict (${p.conflict.conflictScore}) — reduced confidence`);

  reasons.push(`Regime: ${p.regime}`);
  return reasons.slice(0, 8);
}