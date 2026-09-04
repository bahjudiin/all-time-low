import type {
  BinanceKline,
  BinanceFundingRate,
  BinanceLongShortRatio,
} from "@/types/signal";
import type {
  CoinPrediction,
  ExhaustionFactors,
  PriceExtension,
  VolatilityAnalysis,
  MomentumAnalysis,
  VolumeAnalysis,
  OrderFlowAnalysis,
  VWAPAnalysis,
  MarketStructureAnalysis,
  LiquidityAnalysis,
  PredictionState,
  PredictionDirection,
  PredictionQuality,
  PredictionZone,
  LimitLevels,
  ApproachState,
  SwingPoint,
} from "@/types/prediction";

// ── Helpers ─────────────────────────────────────────────────────────

function sma(values: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) sum += values[j];
      result.push(sum / period);
    }
  }
  return result;
}

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

function trueRange(klines: BinanceKline[]): number[] {
  return klines.map((k, i) => {
    if (i === 0) return k.high - k.low;
    const prevClose = klines[i - 1].close;
    return Math.max(k.high - k.low, Math.abs(k.high - prevClose), Math.abs(k.low - prevClose));
  });
}

function zScore(value: number, values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance);
  return std === 0 ? 0 : (value - mean) / std;
}

function percentile(value: number, values: number[]): number {
  if (values.length === 0) return 50;
  const sorted = [...values].sort((a, b) => a - b);
  let count = 0;
  for (const v of sorted) {
    if (v <= value) count++;
  }
  return (count / sorted.length) * 100;
}

function findSwingPoints(klines: BinanceKline[], lookback: number = 5): SwingPoint[] {
  const swings: SwingPoint[] = [];
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

function calcRSI(closes: number[], period: number = 14): number {
  if (closes.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period;
  }
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

// ── VWAP Calculation ────────────────────────────────────────────────

function calcVWAP(klines: BinanceKline[]): number {
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;
  for (const k of klines) {
    const tp = (k.high + k.low + k.close) / 3;
    cumulativeTPV += tp * k.volume;
    cumulativeVolume += k.volume;
  }
  return cumulativeVolume === 0 ? klines[klines.length - 1]?.close ?? 0 : cumulativeTPV / cumulativeVolume;
}

// ── Price Extension Analysis ────────────────────────────────────────

function analyzePriceExtension(
  klines: BinanceKline[],
  currentPrice: number,
): PriceExtension {
  const closes = klines.map((k) => k.close);
  const last = closes[closes.length - 1];

  const ret = (periods: number): number => {
    if (closes.length < periods + 1) return 0;
    const prev = closes[closes.length - 1 - periods];
    return prev === 0 ? 0 : ((last - prev) / prev) * 100;
  };

  const lookback = Math.min(50, klines.length);
  const recentHighs = klines.slice(-lookback).map((k) => k.high);
  const recentLows = klines.slice(-lookback).map((k) => k.low);
  const localHigh = Math.max(...recentHighs);
  const localLow = Math.min(...recentLows);

  const moveFromLocalLow = localLow === 0 ? 0 : ((last - localLow) / localLow) * 100;
  const moveFromLocalHigh = localHigh === 0 ? 0 : ((last - localHigh) / localHigh) * 100;

  const returns: number[] = [];
  for (let i = 1; i < Math.min(100, closes.length); i++) {
    if (closes[closes.length - 1 - i - 1]) {
      returns.push(Math.abs(((closes[closes.length - 1 - i] - closes[closes.length - 1 - i - 1]) / closes[closes.length - 1 - i - 1]) * 100));
    }
  }
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const medianReturn = sortedReturns[Math.floor(sortedReturns.length / 2)] || 1;
  const currentReturn = Math.abs(ret(1));
  const abnormalMove = currentReturn > medianReturn * 2.5;

  const extensionPercentile = percentile(Math.abs(moveFromLocalLow), returns.map((r) => r * 10));

  return {
    ret1m: Math.round(ret(1) * 100) / 100,
    ret3m: Math.round(ret(3) * 100) / 100,
    ret5m: Math.round(ret(5) * 100) / 100,
    ret15m: Math.round(ret(15) * 100) / 100,
    ret30m: Math.round(ret(30) * 100) / 100,
    ret1h: Math.round(ret(60) * 100) / 100,
    moveFromLocalLow: Math.round(moveFromLocalLow * 100) / 100,
    moveFromLocalHigh: Math.round(moveFromLocalHigh * 100) / 100,
    abnormalMove,
    extensionPercentile: Math.round(extensionPercentile),
  };
}

// ── Volatility Analysis ─────────────────────────────────────────────

function analyzeVolatility(klines: BinanceKline[], currentPrice: number): VolatilityAnalysis {
  const tr = trueRange(klines);
  const atrPeriod = 14;
  const atrValues = ema(tr, atrPeriod);
  const atr = atrValues[atrValues.length - 1] || 0;
  const atrNormalized = currentPrice === 0 ? 0 : (atr / currentPrice) * 100;

  const recentATR = atrValues.slice(-20);
  const avgATR = recentATR.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0) / recentATR.filter((v) => !isNaN(v)).length || 1;
  const atrExpansion = avgATR === 0 ? 1 : atr / avgATR;

  const ranges = klines.slice(-20).map((k) => k.high - k.low);
  const avgRange = ranges.reduce((a, b) => a + b, 0) / (ranges.length || 1);
  const lastRange = klines[klines.length - 1].high - klines[klines.length - 1].low;
  const rangeExpansion = avgRange === 0 ? 1 : lastRange / avgRange;

  const historicalATR = atrValues.slice(-100).filter((v) => !isNaN(v));
  const volatilityPercentile = percentile(atr, historicalATR);

  const lookback = Math.min(20, klines.length);
  const moveSize = Math.abs(klines[klines.length - 1].close - klines[klines.length - lookback].close);
  const moveOverATR = atr === 0 ? 0 : moveSize / atr;

  const abnormalVolatility = atrExpansion > 1.8 || volatilityPercentile > 85;

  return {
    atr: Math.round(atr * 10000) / 10000,
    atrNormalized: Math.round(atrNormalized * 100) / 100,
    atrExpansion: Math.round(atrExpansion * 100) / 100,
    rangeExpansion: Math.round(rangeExpansion * 100) / 100,
    volatilityPercentile: Math.round(volatilityPercentile),
    moveOverATR: Math.round(moveOverATR * 100) / 100,
    abnormalVolatility,
  };
}

// ── Momentum Analysis ───────────────────────────────────────────────

function analyzeMomentum(klines: BinanceKline[]): MomentumAnalysis {
  const closes = klines.map((k) => k.close);

  const rsi = calcRSI(closes);
  const rsiExtreme = rsi > 75 || rsi < 25;

  const rsiValues: number[] = [];
  for (let i = Math.max(28, closes.length - 30); i < closes.length; i++) {
    rsiValues.push(calcRSI(closes.slice(0, i + 1)));
  }
  let rsiAcceleration = 0;
  let rsiDeceleration = false;
  if (rsiValues.length >= 6) {
    const recentSlope = (rsiValues[rsiValues.length - 1] - rsiValues[rsiValues.length - 3]) / 2;
    const priorSlope = (rsiValues[rsiValues.length - 3] - rsiValues[rsiValues.length - 6]) / 3;
    rsiAcceleration = recentSlope - priorSlope;
    rsiDeceleration = Math.abs(recentSlope) < Math.abs(priorSlope) * 0.6 && Math.abs(priorSlope) > 0.5;
  }

  const rsiFull: number[] = [];
  for (let i = 14; i < closes.length; i++) {
    rsiFull.push(calcRSI(closes.slice(0, i + 1)));
  }
  let stochRsiK = 50;
  let stochRsiD = 50;
  if (rsiFull.length >= 14) {
    const window = rsiFull.slice(-14);
    const min = Math.min(...window);
    const max = Math.max(...window);
    const range = max - min;
    stochRsiK = range === 0 ? 50 : ((rsiFull[rsiFull.length - 1] - min) / range) * 100;
    const kValues: number[] = [];
    for (let i = Math.max(0, rsiFull.length - 14); i < rsiFull.length; i++) {
      const w = rsiFull.slice(Math.max(0, i - 13), i + 1);
      const mn = Math.min(...w);
      const mx = Math.max(...w);
      const r = mx - mn;
      kValues.push(r === 0 ? 50 : ((rsiFull[i] - mn) / r) * 100);
    }
    stochRsiD = kValues.reduce((a, b) => a + b, 0) / kValues.length;
  }

  const rateOfChange = closes.length >= 6
    ? ((closes[closes.length - 1] - closes[closes.length - 6]) / closes[closes.length - 6]) * 100
    : 0;

  let priceAcceleration = 0;
  let priceDeceleration = false;
  if (closes.length >= 10) {
    const recentVelocity = (closes[closes.length - 1] - closes[closes.length - 3]) / 3;
    const priorVelocity = (closes[closes.length - 3] - closes[closes.length - 6]) / 3;
    const priorVelocity2 = (closes[closes.length - 6] - closes[closes.length - 9]) / 3;
    priceAcceleration = recentVelocity - priorVelocity;
    priceDeceleration = Math.abs(recentVelocity) < Math.abs(priorVelocity) * 0.5 &&
      Math.abs(priorVelocity) > Math.abs(priorVelocity2) * 0.8;
  }

  return {
    rsi: Math.round(rsi * 10) / 10,
    rsiExtreme,
    rsiAcceleration: Math.round(rsiAcceleration * 100) / 100,
    rsiDeceleration,
    stochRsiK: Math.round(stochRsiK * 10) / 10,
    stochRsiD: Math.round(stochRsiD * 10) / 10,
    rateOfChange: Math.round(rateOfChange * 100) / 100,
    priceAcceleration: Math.round(priceAcceleration * 10000) / 10000,
    priceDeceleration,
  };
}

// ── Volume Analysis ─────────────────────────────────────────────────

function analyzeVolume(klines: BinanceKline[]): VolumeAnalysis {
  const volumes = klines.map((k) => k.volume);
  const lastVolume = volumes[volumes.length - 1] || 0;
  const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, volumes.length) || 1;

  const volumeZScore = zScore(lastVolume, volumes.slice(-100));
  const volumeClimax = lastVolume > avgVolume * 2.5;

  const recentCloses = klines.slice(-5).map((k) => k.close);
  const recentVolumes = klines.slice(-5).map((k) => k.volume);
  const priceUp = recentCloses.length >= 2 && recentCloses[recentCloses.length - 1] > recentCloses[0];
  const volumeTrend = recentVolumes.length >= 2
    ? recentVolumes[recentVolumes.length - 1] - recentVolumes[0]
    : 0;
  const volumeIncreasingWithPrice = priceUp && volumeTrend > 0;

  const priceExtendLookback = Math.min(10, klines.length);
  const priceExtended = klines.length >= priceExtendLookback
    ? Math.abs(((klines[klines.length - 1].close - klines[klines.length - priceExtendLookback].close) / klines[klines.length - priceExtendLookback].close) * 100) > 3
    : false;
  const volumeDeclining = recentVolumes.length >= 3 && recentVolumes[recentVolumes.length - 1] < recentVolumes[0] * 0.7;
  const volumeDecliningWhileExtending = priceExtended && volumeDeclining;

  const priceVolumeDivergence = priceUp && volumeTrend < 0;

  return {
    volumeZScore: Math.round(volumeZScore * 100) / 100,
    volumeClimax,
    volumeIncreasingWithPrice,
    volumeDecliningWhileExtending,
    priceVolumeDivergence,
    currentVolume: Math.round(lastVolume),
    averageVolume: Math.round(avgVolume),
  };
}

// ── Order Flow Analysis (graceful degradation) ──────────────────────

function analyzeOrderFlow(
  _klines: BinanceKline[],
  takerRatio: BinanceLongShortRatio[],
): OrderFlowAnalysis {
  if (takerRatio.length === 0) {
    return {
      buySellImbalance: 0,
      aggressiveBuyVolume: 0,
      aggressiveSellVolume: 0,
      delta: 0,
      deltaChange: 0,
      absorptionDetected: false,
      weakeningAggression: false,
      available: false,
    };
  }

  const latest = parseFloat(takerRatio[takerRatio.length - 1].longShortRatio) || 1;
  const prev = takerRatio.length >= 2 ? parseFloat(takerRatio[takerRatio.length - 2].longShortRatio) || 1 : latest;

  const buySellImbalance = latest - 1;
  const deltaChange = latest - prev;
  const weakeningAggression = Math.abs(deltaChange) > 0.1 && Math.abs(latest - 1) < 0.3;

  return {
    buySellImbalance: Math.round(buySellImbalance * 1000) / 1000,
    aggressiveBuyVolume: 0,
    aggressiveSellVolume: 0,
    delta: Math.round((latest - 1) * 1000) / 1000,
    deltaChange: Math.round(deltaChange * 1000) / 1000,
    absorptionDetected: false,
    weakeningAggression,
    available: true,
  };
}

// ── VWAP Analysis ───────────────────────────────────────────────────

function analyzeVWAP(klines: BinanceKline[], currentPrice: number): VWAPAnalysis {
  const vwap = calcVWAP(klines);
  const distanceFromVwap = vwap === 0 ? 0 : ((currentPrice - vwap) / vwap) * 100;

  const deviations = klines.map((k) => {
    const tp = (k.high + k.low + k.close) / 3;
    return tp - vwap;
  });
  const meanDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
  const variance = deviations.reduce((a, b) => a + (b - meanDeviation) ** 2, 0) / deviations.length;
  const stdDev = Math.sqrt(variance);
  const vwapDeviation = vwap === 0 ? 0 : (stdDev / vwap) * 100;

  const extendedFromVwap = Math.abs(distanceFromVwap) > vwapDeviation * 2;

  return {
    vwap: Math.round(vwap * 10000) / 10000,
    distanceFromVwap: Math.round(distanceFromVwap * 100) / 100,
    vwapDeviation: Math.round(vwapDeviation * 100) / 100,
    extendedFromVwap,
  };
}

// ── Market Structure Analysis ───────────────────────────────────────

function analyzeMarketStructure(klines: BinanceKline[]): MarketStructureAnalysis {
  const swings = findSwingPoints(klines, 5);
  const highs = swings.filter((s) => s.type === "high").sort((a, b) => b.index - a.index);
  const lows = swings.filter((s) => s.type === "low").sort((a, b) => b.index - a.index);

  const lastPrice = klines[klines.length - 1].close;

  const previousSwingHigh = highs.length > 0 ? highs[0].price : lastPrice * 1.02;
  const previousSwingLow = lows.length > 0 ? lows[0].price : lastPrice * 0.98;

  const breakout = lastPrice > previousSwingHigh;

  const recentHigh = Math.max(...klines.slice(-3).map((k) => k.high));
  const failedBreakout = recentHigh > previousSwingHigh && lastPrice <= previousSwingHigh;

  const resistanceLevels = highs.slice(0, 3).map((s) => s.price);
  const supportLevels = lows.slice(0, 3).map((s) => s.price);

  const higherHighExhaustion = highs.length >= 2 &&
    highs[0].price > highs[1].price &&
    lastPrice > highs[0].price * 0.99;

  const lowerLowExhaustion = lows.length >= 2 &&
    lows[0].price < lows[1].price &&
    lastPrice < lows[0].price * 1.01;

  const recentRanges = klines.slice(-20).map((k) => k.high - k.low);
  const avgRange = recentRanges.reduce((a, b) => a + b, 0) / (recentRanges.length || 1);
  const longRanges = klines.slice(-50).map((k) => k.high - k.low);
  const longAvgRange = longRanges.reduce((a, b) => a + b, 0) / (longRanges.length || 1);
  const structureCompression = longAvgRange > 0 && avgRange < longAvgRange * 0.5;

  return {
    localHighs: highs.slice(0, 5),
    localLows: lows.slice(0, 5),
    previousSwingHigh: Math.round(previousSwingHigh * 10000) / 10000,
    previousSwingLow: Math.round(previousSwingLow * 10000) / 10000,
    breakout,
    failedBreakout,
    resistanceLevels: resistanceLevels.map((r) => Math.round(r * 10000) / 10000),
    supportLevels: supportLevels.map((s) => Math.round(s * 10000) / 10000),
    higherHighExhaustion,
    lowerLowExhaustion,
    structureCompression,
  };
}

// ── Liquidity Analysis (graceful degradation) ───────────────────────

function analyzeLiquidity(
  _klines: BinanceKline[],
  _currentPrice: number,
  hasLiqData: boolean,
): LiquidityAnalysis {
  if (!hasLiqData) {
    return {
      nearbyLiquidationClusters: [],
      recentLiquidationEvents: 0,
      potentialLiquiditySweep: false,
      available: false,
    };
  }
  return {
    nearbyLiquidationClusters: [],
    recentLiquidationEvents: 0,
    potentialLiquiditySweep: false,
    available: true,
  };
}

// ── Exhaustion Factor Assembly ──────────────────────────────────────

export function computeExhaustionFactors(
  klines: BinanceKline[],
  currentPrice: number,
  takerRatio: BinanceLongShortRatio[],
  hasLiqData: boolean,
): ExhaustionFactors {
  return {
    priceExtension: analyzePriceExtension(klines, currentPrice),
    volatility: analyzeVolatility(klines, currentPrice),
    momentum: analyzeMomentum(klines),
    volume: analyzeVolume(klines),
    orderFlow: analyzeOrderFlow(klines, takerRatio),
    vwap: analyzeVWAP(klines, currentPrice),
    marketStructure: analyzeMarketStructure(klines),
    liquidity: analyzeLiquidity(klines, currentPrice, hasLiqData),
  };
}

// ════════════════════════════════════════════════════════════════════
// CONFLUENCE-BASED SCORING SYSTEM
// ════════════════════════════════════════════════════════════════════

interface ClusterVote {
  name: string;
  vote: -1 | 0 | 1; // -1 = bearish/exhaustion, 0 = neutral, 1 = bullish/continuation
  confidence: number; // 0-1 how strongly this cluster votes
  factors: string[]; // what contributed to this vote
}

// ── Cluster Evaluation ──────────────────────────────────────────────

// Each cluster independently evaluates whether the market is exhausting.
// A SHORT prediction needs clusters to vote -1 (bearish/exhaustion).
// A LONG prediction needs clusters to vote +1 (bullish/oversold exhaustion).
// Clusters that vote 0 are neutral and don't contribute.

function evaluateExtensionCluster(f: ExhaustionFactors): ClusterVote {
  const pe = f.priceExtension;
  const absRet1h = Math.abs(pe.ret1h);
  const factors: string[] = [];
  let score = 0;

  // Strong extension is the primary exhaustion signal
  if (absRet1h > 8) { score += 3; factors.push(`${pe.ret1h > 0 ? "+" : ""}${pe.ret1h.toFixed(1)}% extreme extension`); }
  else if (absRet1h > 5) { score += 2; factors.push(`${pe.ret1h > 0 ? "+" : ""}${pe.ret1h.toFixed(1)}% strong extension`); }
  else if (absRet1h > 3) { score += 1; factors.push(`${pe.ret1h > 0 ? "+" : ""}${pe.ret1h.toFixed(1)}% moderate extension`); }

  // Abnormal move confirms the extension is real, not noise
  if (pe.abnormalMove) { score += 1; factors.push("Abnormal move confirmed"); }

  // High percentile means this extension is rare historically
  if (pe.extensionPercentile > 85) { score += 1; factors.push(`${pe.extensionPercentile}th percentile extension`); }

  // Multi-timeframe alignment: if multiple timeframes show extension, stronger signal
  const alignedTimeframes = [pe.ret1m, pe.ret3m, pe.ret5m, pe.ret15m, pe.ret30m, pe.ret1h]
    .filter((r) => Math.abs(r) > 2).length;
  if (alignedTimeframes >= 4) { score += 1; factors.push(`${alignedTimeframes} timeframes aligned`); }

  // Vote direction: if price extended UP, vote bearish (-1). If extended DOWN, vote bullish (+1).
  // The extension itself tells us direction of exhaustion.
  const vote = pe.ret1h > 0 ? -1 as const : pe.ret1h < 0 ? 1 as const : 0 as const;
  const confidence = Math.min(1, score / 5);

  return { name: "Extension", vote, confidence, factors };
}

function evaluateVolatilityCluster(f: ExhaustionFactors): ClusterVote {
  const va = f.volatility;
  const factors: string[] = [];
  let score = 0;

  if (va.atrExpansion > 2.0) { score += 2; factors.push(`ATR expanded ${va.atrExpansion.toFixed(1)}x — extreme`); }
  else if (va.atrExpansion > 1.5) { score += 1; factors.push(`ATR expanded ${va.atrExpansion.toFixed(1)}x`); }

  if (va.rangeExpansion > 2.0) { score += 1; factors.push(`Range expansion ${va.rangeExpansion.toFixed(1)}x`); }

  if (va.volatilityPercentile > 85) { score += 1; factors.push(`Volatility at ${va.volatilityPercentile}th percentile`); }

  if (va.moveOverATR > 3) { score += 1; factors.push(`Move covers ${va.moveOverATR.toFixed(1)}x ATR`); }

  // High volatility alone doesn't tell direction, but combined with extension it confirms exhaustion
  // Vote mirrors extension direction (needs to be combined with extension cluster for signal)
  const vote = 0 as const; // Volatility is a CONFIRMER, not a direction voter
  const confidence = Math.min(1, score / 4);

  return { name: "Volatility", vote, confidence, factors };
}

function evaluateMomentumCluster(f: ExhaustionFactors, direction: PredictionDirection): ClusterVote {
  const ma = f.momentum;
  const factors: string[] = [];
  let score = 0;

  if (direction === "SHORT") {
    // For SHORT: RSI extreme high + deceleration = exhaustion
    if (ma.rsi > 80) { score += 2; factors.push(`RSI ${ma.rsi.toFixed(0)} — deeply overbought`); }
    else if (ma.rsi > 70) { score += 1; factors.push(`RSI ${ma.rsi.toFixed(0)} — overbought`); }

    if (ma.rsiDeceleration) { score += 2; factors.push("RSI momentum decelerating — key exhaustion signal"); }
    if (ma.priceDeceleration) { score += 2; factors.push("Price velocity decelerating — key exhaustion signal"); }

    // RSI deceleration while price still rising is THE classic divergence
    if (ma.rsiDeceleration && ma.priceAcceleration < 0) {
      score += 1; factors.push("Bearish RSI/price divergence");
    }
  } else {
    // For LONG: RSI extreme low + deceleration = exhaustion
    if (ma.rsi < 20) { score += 2; factors.push(`RSI ${ma.rsi.toFixed(0)} — deeply oversold`); }
    else if (ma.rsi < 30) { score += 1; factors.push(`RSI ${ma.rsi.toFixed(0)} — oversold`); }

    if (ma.rsiDeceleration) { score += 2; factors.push("Selling momentum decelerating — key exhaustion signal"); }
    if (ma.priceDeceleration) { score += 2; factors.push("Price decline decelerating — key exhaustion signal"); }

    if (ma.rsiDeceleration && ma.priceAcceleration > 0) {
      score += 1; factors.push("Bullish RSI/price divergence");
    }
  }

  // StochRSI confirmation
  if (direction === "SHORT" && ma.stochRsiK > 80) { score += 1; factors.push(`StochRSI K=${ma.stochRsiK.toFixed(0)} — overbought`); }
  if (direction === "LONG" && ma.stochRsiK < 20) { score += 1; factors.push(`StochRSI K=${ma.stochRsiK.toFixed(0)} — oversold`); }

  const vote = direction === "SHORT" ? -1 as const : 1 as const;
  const confidence = Math.min(1, score / 5);

  return { name: "Momentum", vote, confidence, factors };
}

function evaluateVolumeCluster(f: ExhaustionFactors, direction: PredictionDirection): ClusterVote {
  const vol = f.volume;
  const factors: string[] = [];
  let score = 0;

  // Volume climax is a strong exhaustion signal
  if (vol.volumeClimax) { score += 2; factors.push("Volume climax — extreme participation"); }

  // Volume declining while price extends = buyers/sellers losing steam
  if (vol.volumeDecliningWhileExtending) {
    score += 2; factors.push("Volume declining during extension — participation fading");
  }

  // Price/volume divergence is a classic exhaustion signal
  if (vol.priceVolumeDivergence) {
    score += 1; factors.push("Price/volume divergence — bearish");
  }

  // High Z-score means volume is unusually high (climax territory)
  if (Math.abs(vol.volumeZScore) > 2) {
    score += 1; factors.push(`Volume Z-score ${vol.volumeZScore.toFixed(1)} — unusual`);
  }

  const vote = direction === "SHORT" ? -1 as const : 1 as const;
  const confidence = Math.min(1, score / 4);

  return { name: "Volume", vote, confidence, factors };
}

function evaluateFlowCluster(f: ExhaustionFactors, direction: PredictionDirection): ClusterVote {
  const of = f.orderFlow;
  const vwap = f.vwap;
  const factors: string[] = [];
  let score = 0;

  // Order flow weakening
  if (of.available) {
    if (of.weakeningAggression) {
      score += 2; factors.push("Aggressive flow weakening — participation fading");
    }
    if (Math.abs(of.deltaChange) > 0.2) {
      score += 1; factors.push(`Delta shift ${of.deltaChange > 0 ? "+" : ""}${of.deltaChange.toFixed(3)}`);
    }
  }

  // VWAP extension
  if (vwap.extendedFromVwap) {
    score += 1;
    factors.push(`Extended ${vwap.distanceFromVwap.toFixed(1)}% from VWAP`);
  }

  const vote = direction === "SHORT" ? -1 as const : 1 as const;
  const confidence = Math.min(1, score / 3);

  return { name: "Flow", vote, confidence, factors };
}

function evaluateStructureCluster(f: ExhaustionFactors, direction: PredictionDirection): ClusterVote {
  const ms = f.marketStructure;
  const factors: string[] = [];
  let score = 0;

  if (ms.failedBreakout) {
    score += 2; factors.push("Failed breakout — rejection at resistance");
  }

  if (direction === "SHORT" && ms.higherHighExhaustion) {
    score += 2; factors.push("Higher-high exhaustion — making new highs with fading momentum");
  }
  if (direction === "LONG" && ms.lowerLowExhaustion) {
    score += 2; factors.push("Lower-low exhaustion — making new lows with fading selling");
  }

  // Resistance proximity strengthens the setup
  if (direction === "SHORT" && ms.resistanceLevels.length > 0) {
    const nearest = ms.resistanceLevels[0];
    const distPct = Math.abs((nearest - f.priceExtension.moveFromLocalLow) / nearest * 100);
    if (distPct < 2) {
      score += 1; factors.push("Near resistance level");
    }
  }

  const vote = direction === "SHORT" ? -1 as const : 1 as const;
  const confidence = Math.min(1, score / 4);

  return { name: "Structure", vote, confidence, factors };
}

// ── Confluence Scoring ──────────────────────────────────────────────

function computeConfluenceScore(
  clusters: ClusterVote[],
  direction: PredictionDirection,
  factors: ExhaustionFactors,
): { exhaustion: number; continuation: number; zoneReach: number; conflictingClusters: number; agreeingClusters: number } {
  const expectedVote = direction === "SHORT" ? -1 : 1;

  // Classify clusters by their vote relative to our direction
  const agreeing = clusters.filter((c) => c.vote === expectedVote);
  const conflicting = clusters.filter((c) => c.vote !== 0 && c.vote !== expectedVote);
  const neutral = clusters.filter((c) => c.vote === 0);

  // Weighted confluence: only agreeing clusters contribute
  let agreeingWeight = 0;
  let maxPossibleWeight = 0;

  for (const c of clusters) {
    const weight = c.confidence * 10; // each cluster contributes up to 10
    maxPossibleWeight += weight;
    if (c.vote === expectedVote) {
      agreeingWeight += weight;
    }
  }

  // Base exhaustion score from confluence
  let exhaustion = maxPossibleWeight > 0
    ? Math.round((agreeingWeight / maxPossibleWeight) * 100)
    : 0;

  // CONFLICT PENALTY: each conflicting cluster reduces the score
  const conflictPenalty = conflicting.length * 12;
  exhaustion = Math.max(0, exhaustion - conflictPenalty);

  // NEUTRAL PENALTY: neutral clusters slightly reduce confidence (they don't confirm)
  const neutralPenalty = neutral.length * 3;
  exhaustion = Math.max(0, exhaustion - neutralPenalty);

  // MINIMUM CONFLUENCE GATE: need at least 2 agreeing clusters for any meaningful signal
  if (agreeing.length < 2) {
    exhaustion = Math.min(exhaustion, 35); // Cap at WATCH level
  }

  // QUALITY GATE: if key clusters (Extension + Momentum) don't both agree, cap harder
  const extensionCluster = clusters.find((c) => c.name === "Extension");
  const momentumCluster = clusters.find((c) => c.name === "Momentum");
  const bothKeyClustersAgree =
    extensionCluster?.vote === expectedVote && momentumCluster?.vote === expectedVote;

  if (!bothKeyClustersAgree) {
    exhaustion = Math.min(exhaustion, 55); // Can't be higher than B-level without both
  }

  // BONUS: when 4+ clusters agree, boost significantly
  if (agreeing.length >= 4) {
    exhaustion = Math.min(95, exhaustion + 10);
  }
  if (agreeing.length >= 5) {
    exhaustion = Math.min(98, exhaustion + 5);
  }

  const continuation = Math.max(5, 100 - exhaustion);

  // Zone reach: based on how strong the setup is and how far price needs to travel
  const extensionStrength = Math.abs(factors.priceExtension.ret1h);
  const volatilityFactor = factors.volatility.atrNormalized;
  const baseReach = 50 + agreeing.length * 6;
  const zoneReach = Math.min(95, Math.max(10, Math.round(
    baseReach + extensionStrength * 2 - volatilityFactor * 3
  )));

  return {
    exhaustion: Math.min(95, Math.max(0, exhaustion)),
    continuation,
    zoneReach,
    conflictingClusters: conflicting.length,
    agreeingClusters: agreeing.length,
  };
}

// ── Fake Signal Filter ──────────────────────────────────────────────

function isFakeSignal(
  factors: ExhaustionFactors,
  exhaustionProb: number,
  agreeingClusters: number,
  conflictingClusters: number,
  direction: PredictionDirection,
): boolean {
  const pe = factors.priceExtension;
  const ma = factors.momentum;

  // Rule 1: No real extension = no real exhaustion signal
  if (Math.abs(pe.ret1h) < 1.5) return true;

  // Rule 2: Fewer than 2 agreeing clusters = insufficient confluence
  if (agreeingClusters < 2) return true;

  // Rule 3: More conflicting than agreeing = contradictory signals
  if (conflictingClusters >= agreeingClusters) return true;

  // Rule 4: RSI is neutral but we're claiming exhaustion
  const rsiNeutral = ma.rsi > 35 && ma.rsi < 65;
  if (rsiNeutral && exhaustionProb > 60) return true;

  // Rule 5: Price barely moved but high exhaustion probability
  if (Math.abs(pe.ret1h) < 2 && exhaustionProb > 70) return true;

  // Rule 6: Direction based only on RSI without extension support
  if (Math.abs(pe.ret1h) < 2) {
    const onlyRsiDriving = (direction === "SHORT" && ma.rsi > 60 && Math.abs(pe.ret1h) < 1) ||
      (direction === "LONG" && ma.rsi < 40 && Math.abs(pe.ret1h) < 1);
    if (onlyRsiDriving) return true;
  }

  return false;
}

// ── Main Probability Calculation ────────────────────────────────────

function computeProbabilities(factors: ExhaustionFactors, direction: PredictionDirection): {
  continuation: number;
  exhaustion: number;
  zoneReach: number;
} {
  // Build all cluster votes
  const clusters: ClusterVote[] = [
    evaluateExtensionCluster(factors),
    evaluateVolatilityCluster(factors),
    evaluateMomentumCluster(factors, direction),
    evaluateVolumeCluster(factors, direction),
    evaluateFlowCluster(factors, direction),
    evaluateStructureCluster(factors, direction),
  ];

  const result = computeConfluenceScore(clusters, direction, factors);

  // Apply fake signal filter
  const isFake = isFakeSignal(
    factors,
    result.exhaustion,
    result.agreeingClusters,
    result.conflictingClusters,
    direction,
  );

  if (isFake) {
    return {
      exhaustion: Math.min(result.exhaustion, 40),
      continuation: Math.max(60, result.continuation),
      zoneReach: Math.min(result.zoneReach, 45),
    };
  }

  return {
    exhaustion: result.exhaustion,
    continuation: result.continuation,
    zoneReach: result.zoneReach,
  };
}

// ── Zone Prediction ─────────────────────────────────────────────────

function predictZone(
  currentPrice: number,
  direction: PredictionDirection,
  factors: ExhaustionFactors,
): { zone: PredictionZone; levels: LimitLevels; invalidation: number; projectedMove: number; expectedReversal: number } {
  const atr = factors.volatility.atr;

  const extensionFactor = Math.min(2, Math.max(0.5, Math.abs(factors.priceExtension.ret1h) / 5));
  const zoneWidth = atr * extensionFactor;

  const distanceFactor = Math.min(3, Math.max(0.5, Math.abs(factors.priceExtension.ret1h) / 3));
  const zoneDistance = atr * distanceFactor;

  let zone: PredictionZone;
  let levels: LimitLevels;
  let invalidation: number;
  let projectedMove: number;
  let expectedReversal: number;

  if (direction === "SHORT") {
    const zoneCenter = currentPrice + zoneDistance;
    zone = {
      upper: Math.round((zoneCenter + zoneWidth / 2) * 10000) / 10000,
      lower: Math.round((zoneCenter - zoneWidth / 2) * 10000) / 10000,
    };
    levels = {
      l1: Math.round((zone.lower + zoneWidth * 0.2) * 10000) / 10000,
      l2: Math.round(zoneCenter * 10000) / 10000,
      l3: Math.round((zone.upper - zoneWidth * 0.1) * 10000) / 10000,
    };
    invalidation = Math.round((zone.upper + atr * 1.5) * 10000) / 10000;
    projectedMove = Math.round(atr * 2 * 10000) / 10000;
    expectedReversal = Math.round((currentPrice - atr * 1.5) * 10000) / 10000;
  } else {
    const zoneCenter = currentPrice - zoneDistance;
    zone = {
      upper: Math.round((zoneCenter + zoneWidth / 2) * 10000) / 10000,
      lower: Math.round((zoneCenter - zoneWidth / 2) * 10000) / 10000,
    };
    levels = {
      l1: Math.round((zone.upper - zoneWidth * 0.2) * 10000) / 10000,
      l2: Math.round(zoneCenter * 10000) / 10000,
      l3: Math.round((zone.lower + zoneWidth * 0.1) * 10000) / 10000,
    };
    invalidation = Math.round((zone.lower - atr * 1.5) * 10000) / 10000;
    projectedMove = Math.round(atr * 2 * 10000) / 10000;
    expectedReversal = Math.round((currentPrice + atr * 1.5) * 10000) / 10000;
  }

  return { zone, levels, invalidation, projectedMove, expectedReversal };
}

// ── State Machine ───────────────────────────────────────────────────

function determineState(
  factors: ExhaustionFactors,
  exhaustionProb: number,
  currentPrice: number,
  zone: PredictionZone,
): PredictionState {
  const pe = factors.priceExtension;
  const ma = factors.momentum;
  const va = factors.volume;

  const priceInZone = currentPrice >= zone.lower && currentPrice <= zone.upper;
  if (priceInZone) return "touched";

  const extension = Math.abs(pe.ret1h);
  const hasExhaustion = exhaustionProb > 60;
  const hasMomentumDecel = ma.rsiDeceleration || ma.priceDeceleration;
  const hasVolumeExhaustion = va.volumeClimax || va.volumeDecliningWhileExtending;

  if (extension > 8 && hasExhaustion) return "extreme";
  if (extension > 5 && hasExhaustion && hasMomentumDecel) return "exhaustion_building";
  if (extension > 3 && (hasMomentumDecel || hasVolumeExhaustion)) return "target_forming";
  if (extension > 3) return "extended";
  if (extension > 1.5 && factors.volatility.atrExpansion > 1.3) return "accelerating";
  if (extension > 0.5) return "move_detected";
  return "normal";
}

function determineDirection(factors: ExhaustionFactors, _currentPrice: number): PredictionDirection {
  const pe = factors.priceExtension;

  if (pe.ret1h > 1 || pe.moveFromLocalLow > 3) return "SHORT";
  if (pe.ret1h < -1 || pe.moveFromLocalHigh < -3) return "LONG";

  if (factors.momentum.rsi > 65) return "SHORT";
  if (factors.momentum.rsi < 35) return "LONG";

  return "SHORT";
}

function determineQuality(
  factors: ExhaustionFactors,
  exhaustionProb: number,
  agreeingClusters: number,
  conflictingClusters: number,
): PredictionQuality {
  // Quality requires BOTH high confluence AND high exhaustion probability
  // AND low conflict

  // Conflict check: if any clusters conflict, quality is capped
  if (conflictingClusters > 0 && agreeingClusters <= 2) {
    if (exhaustionProb >= 50) return "C";
    return "WATCH";
  }

  // A+: requires 5+ agreeing clusters, 0 conflicts, exhaustion > 80
  if (agreeingClusters >= 5 && conflictingClusters === 0 && exhaustionProb >= 80) return "A+";

  // A: requires 4+ agreeing clusters, exhaustion > 70
  if (agreeingClusters >= 4 && exhaustionProb >= 70 && conflictingClusters === 0) return "A";

  // B: requires 3+ agreeing clusters, exhaustion > 55
  if (agreeingClusters >= 3 && exhaustionProb >= 55) return "B";

  // C: requires 2+ agreeing clusters, exhaustion > 40
  if (agreeingClusters >= 2 && exhaustionProb >= 40) return "C";

  return "WATCH";
}

function determineApproachState(
  currentPrice: number,
  zone: PredictionZone,
  _atr: number,
): ApproachState {
  const zoneMid = (zone.upper + zone.lower) / 2;
  const zoneWidth = zone.upper - zone.lower;
  const distToZone = currentPrice - zoneMid;
  const distPct = zoneMid === 0 ? 0 : Math.abs(distToZone / zoneMid) * 100;

  if (currentPrice >= zone.lower && currentPrice <= zone.upper) return "TOUCHING";

  const thresholdNear = (zoneWidth / zoneMid) * 100 * 0.5 || 0.3;
  const thresholdApproaching = (zoneWidth / zoneMid) * 100 * 2 || 1.5;

  if (distPct < thresholdNear) return "NEAR";
  if (distPct < thresholdApproaching) return "APPROACHING";
  return "FAR";
}

// ── Supporting/Warning Factors ──────────────────────────────────────

function identifyFactors(
  factors: ExhaustionFactors,
  direction: PredictionDirection,
  quality: PredictionQuality,
  agreeingClusters: number,
  conflictingClusters: number,
): { supporting: string[]; warnings: string[] } {
  const supporting: string[] = [];
  const warnings: string[] = [];

  const pe = factors.priceExtension;
  const ma = factors.momentum;
  const va = factors.volume;
  const vwap = factors.vwap;
  const ms = factors.marketStructure;
  const volatility = factors.volatility;

  if (direction === "SHORT") {
    if (Math.abs(pe.ret1h) > 5) supporting.push(`Strong +${pe.ret1h.toFixed(1)}% extension`);
    if (pe.abnormalMove) supporting.push("Abnormal price move detected");
    if (ma.rsi > 70) supporting.push(`RSI overbought at ${ma.rsi.toFixed(0)}`);
    if (ma.rsiDeceleration) supporting.push("RSI momentum decelerating");
    if (ma.priceDeceleration) supporting.push("Price velocity decelerating");
    if (va.volumeClimax) supporting.push("Volume climax detected");
    if (va.volumeDecliningWhileExtending) supporting.push("Volume declining during extension");
    if (va.priceVolumeDivergence) supporting.push("Price/volume bearish divergence");
    if (vwap.extendedFromVwap) supporting.push(`Extended ${vwap.distanceFromVwap.toFixed(1)}% from VWAP`);
    if (ms.failedBreakout) supporting.push("Failed breakout detected");
    if (ms.higherHighExhaustion) supporting.push("Higher-high exhaustion pattern");
    if (volatility.abnormalVolatility) supporting.push("Abnormal volatility expansion");
    if (volatility.atrExpansion > 1.5) supporting.push(`ATR expanded ${volatility.atrExpansion.toFixed(1)}x`);
    if (factors.orderFlow.available && factors.orderFlow.weakeningAggression) supporting.push("Aggressive buying weakening");
    if (pe.extensionPercentile > 80) supporting.push(`Extension at ${pe.extensionPercentile}th percentile`);
  } else {
    if (Math.abs(pe.ret1h) < -5) supporting.push(`Strong ${pe.ret1h.toFixed(1)}% decline`);
    if (pe.abnormalMove) supporting.push("Abnormal price move detected");
    if (ma.rsi < 30) supporting.push(`RSI oversold at ${ma.rsi.toFixed(0)}`);
    if (ma.rsiDeceleration) supporting.push("RSI selling momentum decelerating");
    if (ma.priceDeceleration) supporting.push("Price decline decelerating");
    if (va.volumeClimax) supporting.push("Volume climax detected");
    if (va.volumeDecliningWhileExtending) supporting.push("Volume declining during selloff");
    if (va.priceVolumeDivergence) supporting.push("Price/volume bullish divergence");
    if (vwap.extendedFromVwap) supporting.push(`Extended ${Math.abs(vwap.distanceFromVwap).toFixed(1)}% below VWAP`);
    if (ms.failedBreakout) supporting.push("Failed breakdown detected");
    if (ms.lowerLowExhaustion) supporting.push("Lower-low exhaustion pattern");
    if (volatility.abnormalVolatility) supporting.push("Abnormal volatility expansion");
    if (volatility.atrExpansion > 1.5) supporting.push(`ATR expanded ${volatility.atrExpansion.toFixed(1)}x`);
    if (factors.orderFlow.available && factors.orderFlow.weakeningAggression) supporting.push("Aggressive selling weakening");
    if (pe.extensionPercentile > 80) supporting.push(`Extension at ${pe.extensionPercentile}th percentile`);
  }

  // Conflict warnings
  if (conflictingClusters > 0) {
    warnings.push(`${conflictingClusters} cluster${conflictingClusters > 1 ? "s" : ""} conflicting — reduced confidence`);
  }
  if (agreeingClusters < 3) {
    warnings.push(`Only ${agreeingClusters} confirming cluster${agreeingClusters !== 1 ? "s" : ""} — weak confluence`);
  }

  // Data quality warnings
  if (!factors.orderFlow.available) warnings.push("Order flow data unavailable");
  if (!factors.liquidity.available) warnings.push("Liquidity data unavailable");
  if (quality === "WATCH") warnings.push("Low confluence — watch only, not a trade signal");
  if (factors.momentum.rsi > 40 && factors.momentum.rsi < 60) warnings.push("RSI neutral — no momentum extreme");
  if (Math.abs(factors.priceExtension.ret1h) < 1) warnings.push("Minimal recent extension");
  if (factors.volatility.atrNormalized < 1) warnings.push("Low volatility environment");

  return { supporting, warnings };
}

// ── Main Prediction Function ────────────────────────────────────────

export function computePrediction(
  symbol: string,
  name: string,
  image: string,
  currentPrice: number,
  klines: BinanceKline[],
  takerRatio: BinanceLongShortRatio[],
  hasLiqData: boolean,
  exchangeSource: string,
): CoinPrediction | null {
  if (klines.length < 30) return null;

  const factors = computeExhaustionFactors(klines, currentPrice, takerRatio, hasLiqData);

  // Determine direction FIRST (needed by momentum/volume/flow/structure clusters)
  const direction = determineDirection(factors, currentPrice);

  // Build all cluster votes
  const clusters: ClusterVote[] = [
    evaluateExtensionCluster(factors),
    evaluateVolatilityCluster(factors),
    evaluateMomentumCluster(factors, direction),
    evaluateVolumeCluster(factors, direction),
    evaluateFlowCluster(factors, direction),
    evaluateStructureCluster(factors, direction),
  ];

  const expectedVote = direction === "SHORT" ? -1 : 1;
  const agreeingClusters = clusters.filter((c) => c.vote === expectedVote).length;
  const conflictingClusters = clusters.filter((c) => c.vote !== 0 && c.vote !== expectedVote).length;

  const probs = computeProbabilities(factors, direction);
  const { zone, levels, invalidation, projectedMove, expectedReversal } = predictZone(currentPrice, direction, factors);
  const state = determineState(factors, probs.exhaustion, currentPrice, zone);
  const quality = determineQuality(factors, probs.exhaustion, agreeingClusters, conflictingClusters);
  const approachState = determineApproachState(currentPrice, zone, factors.volatility.atr);

  const distanceToZone = direction === "SHORT"
    ? zone.lower - currentPrice
    : currentPrice - zone.upper;
  const distanceToZonePct = currentPrice === 0 ? 0 : (Math.abs(distanceToZone) / currentPrice) * 100;

  const { supporting, warnings } = identifyFactors(factors, direction, quality, agreeingClusters, conflictingClusters);

  const movePercent = direction === "SHORT"
    ? factors.priceExtension.moveFromLocalLow
    : -factors.priceExtension.moveFromLocalHigh;

  return {
    symbol,
    name,
    image,
    currentPrice,
    direction,
    state,
    quality,
    movePercent: Math.round(movePercent * 100) / 100,
    predictedZone: zone,
    limitLevels: levels,
    invalidation,
    projectedMove,
    expectedReversalArea: expectedReversal,
    continuationProbability: probs.continuation,
    exhaustionProbability: probs.exhaustion,
    zoneReachProbability: probs.zoneReach,
    approachState,
    distanceToZone: Math.round(distanceToZone * 10000) / 10000,
    distanceToZonePct: Math.round(distanceToZonePct * 100) / 100,
    factors,
    supportingFactors: supporting,
    warningFactors: warnings,
    lastUpdate: Date.now(),
    exchangeSource,
  };
}
