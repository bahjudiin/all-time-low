import type {
  RSIResult,
  StochRSIResult,
  EMAResult,
  MACDResult,
  ADXResult,
  BollingerResult,
  CCIResult,
  ATRResult,
  OBVResult,
  ATHATLResult,
  BinanceKline,
} from "@/types/signal";

// ── Helpers ────────────────────────────────────────────────────────

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

// ── RSI (14) ───────────────────────────────────────────────────────

export function calcRSI(closes: number[], period: number = 14): RSIResult {
  if (closes.length < period + 1) return { value: 50, signal: 0, label: "50" };

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
  const value = 100 - 100 / (1 + rs);

  let signal: -1 | 0 | 1 = 0;
  if (value <= 30) signal = 1;
  else if (value >= 70) signal = -1;

  return { value: Math.round(value * 10) / 10, signal, label: value.toFixed(1) };
}

// ── Stochastic RSI (14, 14, 3, 3) ─────────────────────────────────

export function calcStochRSI(closes: number[]): StochRSIResult {
  if (closes.length < 28) return { k: 50, d: 50, signal: 0, label: "50/50" };

  const rsiValues: number[] = [];
  for (let i = 14; i < closes.length; i++) {
    rsiValues.push(calcRSI(closes.slice(0, i + 1), 14).value);
  }

  if (rsiValues.length < 14) return { k: 50, d: 50, signal: 0, label: "50/50" };

  const stochK: number[] = [];
  for (let i = 13; i < rsiValues.length; i++) {
    const window = rsiValues.slice(i - 13, i + 1);
    const min = Math.min(...window);
    const max = Math.max(...window);
    const range = max - min;
    stochK.push(range === 0 ? 50 : ((rsiValues[i] - min) / range) * 100);
  }

  const k = stochK.length > 0 ? stochK[stochK.length - 1] : 50;
  const dValues = sma(stochK, 3);
  const d = dValues.length > 0 ? dValues[dValues.length - 1] : k;

  let signal: -1 | 0 | 1 = 0;
  if (k <= 20 && d <= 20) signal = 1;
  else if (k >= 80 && d >= 80) signal = -1;
  else if (k > d && k < 30) signal = 1;
  else if (k < d && k > 70) signal = -1;

  return {
    k: Math.round(k * 10) / 10,
    d: Math.round((isNaN(d) ? k : d) * 10) / 10,
    signal,
    label: `${Math.round(k)}/${Math.round(isNaN(d) ? k : d)}`,
  };
}

// ── EMA Crossover (9/21) ──────────────────────────────────────────

export function calcEMA(closes: number[], fastPeriod: number = 9, slowPeriod: number = 21): EMAResult {
  if (closes.length < slowPeriod + 2) {
    return { fast: 0, slow: 0, crossover: "none", signal: 0, label: "—" };
  }

  const fastEMA = ema(closes, fastPeriod);
  const slowEMA = ema(closes, slowPeriod);

  const fast = fastEMA[fastEMA.length - 1];
  const slow = slowEMA[slowEMA.length - 1];
  const prevFast = fastEMA[fastEMA.length - 2];
  const prevSlow = slowEMA[slowEMA.length - 2];

  let crossover: "bullish" | "bearish" | "none" = "none";
  if (prevFast <= prevSlow && fast > slow) crossover = "bullish";
  else if (prevFast >= prevSlow && fast < slow) crossover = "bearish";

  let signal: -1 | 0 | 1 = 0;
  if (crossover === "bullish") signal = 1;
  else if (crossover === "bearish") signal = -1;
  else if (fast > slow) signal = 1;
  else if (fast < slow) signal = -1;

  return {
    fast: Math.round(fast * 100) / 100,
    slow: Math.round(slow * 100) / 100,
    crossover,
    signal,
    label: crossover === "none" ? (fast > slow ? "↑" : "↓") : crossover === "bullish" ? "↑ CROSS" : "↓ CROSS",
  };
}

// ── MACD (12, 26, 9) ──────────────────────────────────────────────

export function calcMACD(closes: number[]): MACDResult {
  if (closes.length < 35) {
    return { macd: 0, signalLine: 0, histogram: 0, crossover: "none", signal: 0, label: "—" };
  }

  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = ema(macdLine, 9);

  const macd = macdLine[macdLine.length - 1];
  const signalVal = signalLine[signalLine.length - 1];
  const hist = macd - signalVal;
  const prevHist = macdLine[macdLine.length - 2] - signalLine[signalLine.length - 2];

  let crossover: "bullish" | "bearish" | "none" = "none";
  if (prevHist <= 0 && hist > 0) crossover = "bullish";
  else if (prevHist >= 0 && hist < 0) crossover = "bearish";

  let signal: -1 | 0 | 1 = 0;
  if (crossover === "bullish") signal = 1;
  else if (crossover === "bearish") signal = -1;
  else if (hist > 0) signal = 1;
  else if (hist < 0) signal = -1;

  return {
    macd: Math.round(macd * 10000) / 10000,
    signalLine: Math.round(signalVal * 10000) / 10000,
    histogram: Math.round(hist * 10000) / 10000,
    crossover,
    signal,
    label: crossover === "none" ? (hist > 0 ? "↑" : "↓") : crossover === "bullish" ? "↑ CROSS" : "↓ CROSS",
  };
}

// ── ADX (14) ───────────────────────────────────────────────────────

export function calcADX(klines: BinanceKline[], period: number = 14): ADXResult {
  if (klines.length < period * 2) {
    return { adx: 0, plusDI: 0, minusDI: 0, trendStrength: "none", signal: 0, label: "—" };
  }

  const tr = trueRange(klines);
  const plusDM: number[] = [];
  const minusDM: number[] = [];

  for (let i = 1; i < klines.length; i++) {
    const upMove = klines[i].high - klines[i - 1].high;
    const downMove = klines[i - 1].low - klines[i].low;
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }

  const atrSmooth = ema(tr.slice(1), period);
  const plusDMSmooth = ema(plusDM, period);
  const minusDMSmooth = ema(minusDM, period);

  const dx: number[] = [];
  for (let i = 0; i < atrSmooth.length; i++) {
    const pdi = atrSmooth[i] === 0 ? 0 : (plusDMSmooth[i] / atrSmooth[i]) * 100;
    const mdi = atrSmooth[i] === 0 ? 0 : (minusDMSmooth[i] / atrSmooth[i]) * 100;
    const sum = pdi + mdi;
    dx.push(sum === 0 ? 0 : (Math.abs(pdi - mdi) / sum) * 100);
  }

  const adxValues = ema(dx, period);
  const adx = adxValues[adxValues.length - 1] || 0;
  const lastPDI = atrSmooth.length === 0 ? 0 : (plusDMSmooth[plusDMSmooth.length - 1] / atrSmooth[atrSmooth.length - 1]) * 100;
  const lastMDI = atrSmooth.length === 0 ? 0 : (minusDMSmooth[minusDMSmooth.length - 1] / atrSmooth[atrSmooth.length - 1]) * 100;

  let trendStrength: "strong" | "moderate" | "weak" | "none" = "none";
  if (adx >= 40) trendStrength = "strong";
  else if (adx >= 25) trendStrength = "moderate";
  else if (adx >= 15) trendStrength = "weak";

  let signal: -1 | 0 | 1 = 0;
  if (adx >= 25 && lastPDI > lastMDI) signal = 1;
  else if (adx >= 25 && lastMDI > lastPDI) signal = -1;

  return {
    adx: Math.round(adx * 10) / 10,
    plusDI: Math.round(lastPDI * 10) / 10,
    minusDI: Math.round(lastMDI * 10) / 10,
    trendStrength,
    signal,
    label: `${adx.toFixed(1)} ${trendStrength === "strong" ? "●●●" : trendStrength === "moderate" ? "●●" : trendStrength === "weak" ? "●" : "—"}`,
  };
}

// ── Bollinger Bands (20, 2) ────────────────────────────────────────

export function calcBollinger(closes: number[], period: number = 20, stdDev: number = 2): BollingerResult {
  if (closes.length < period) {
    return { upper: 0, middle: 0, lower: 0, position: "middle", bandwidth: 0, signal: 0, label: "—" };
  }

  const smaValues = sma(closes, period);
  const middle = smaValues[smaValues.length - 1];
  const lastClose = closes[closes.length - 1];

  const window = closes.slice(-period);
  const mean = window.reduce((a, b) => a + b, 0) / window.length;
  const variance = window.reduce((a, b) => a + (b - mean) ** 2, 0) / window.length;
  const std = Math.sqrt(variance);

  const upper = middle + stdDev * std;
  const lower = middle - stdDev * std;
  const bandwidth = middle === 0 ? 0 : ((upper - lower) / middle) * 100;

  let position: BollingerResult["position"] = "middle";
  if (lastClose > upper) position = "above_upper";
  else if (lastClose > upper - (upper - middle) * 0.2) position = "near_upper";
  else if (lastClose < lower) position = "below_lower";
  else if (lastClose < lower + (middle - lower) * 0.2) position = "near_lower";

  let signal: -1 | 0 | 1 = 0;
  if (position === "below_lower") signal = 1;
  else if (position === "near_lower") signal = 1;
  else if (position === "above_upper") signal = -1;
  else if (position === "near_upper") signal = -1;

  return {
    upper: Math.round(upper * 100) / 100,
    middle: Math.round(middle * 100) / 100,
    lower: Math.round(lower * 100) / 100,
    position,
    bandwidth: Math.round(bandwidth * 100) / 100,
    signal,
    label: position.replace("_", " "),
  };
}

// ── CCI (20) ───────────────────────────────────────────────────────

export function calcCCI(klines: BinanceKline[], period: number = 20): CCIResult {
  if (klines.length < period) return { value: 0, signal: 0, label: "0" };

  const typicalPrices = klines.map((k) => (k.high + k.low + k.close) / 3);
  const smaValues = sma(typicalPrices, period);

  const lastTP = typicalPrices[typicalPrices.length - 1];
  const lastSMA = smaValues[smaValues.length - 1];

  const window = typicalPrices.slice(-period);
  const mean = window.reduce((a, b) => a + b, 0) / window.length;
  const meanDev = window.reduce((a, b) => a + Math.abs(b - mean), 0) / window.length;

  const cci = meanDev === 0 ? 0 : (lastTP - lastSMA) / (0.015 * meanDev);

  let signal: -1 | 0 | 1 = 0;
  if (cci <= -100) signal = 1;
  else if (cci >= 100) signal = -1;

  return {
    value: Math.round(cci * 10) / 10,
    signal,
    label: cci.toFixed(0),
  };
}

// ── ATR (14) ───────────────────────────────────────────────────────

export function calcATR(klines: BinanceKline[], period: number = 14): ATRResult {
  if (klines.length < period + 1) {
    return { value: 0, normalizedPct: 0, volatilityRegime: "normal", label: "—" };
  }

  const tr = trueRange(klines);
  const atrValues = ema(tr, period);
  const atr = atrValues[atrValues.length - 1] || 0;
  const lastClose = klines[klines.length - 1].close;
  const normalizedPct = lastClose === 0 ? 0 : (atr / lastClose) * 100;

  let volatilityRegime: "high" | "normal" | "low" = "normal";
  if (normalizedPct > 5) volatilityRegime = "high";
  else if (normalizedPct < 2) volatilityRegime = "low";

  return {
    value: Math.round(atr * 100) / 100,
    normalizedPct: Math.round(normalizedPct * 100) / 100,
    volatilityRegime,
    label: `${normalizedPct.toFixed(1)}% ${volatilityRegime === "high" ? "🔴" : volatilityRegime === "low" ? "🟢" : "🟡"}`,
  };
}

// ── OBV ────────────────────────────────────────────────────────────

export function calcOBV(klines: BinanceKline[]): OBVResult {
  if (klines.length < 20) {
    return { current: 0, previous: 0, trend: "flat", divergence: "none", signal: 0, label: "—" };
  }

  const obv: number[] = [0];
  for (let i = 1; i < klines.length; i++) {
    if (klines[i].close > klines[i - 1].close) {
      obv.push(obv[i - 1] + klines[i].volume);
    } else if (klines[i].close < klines[i - 1].close) {
      obv.push(obv[i - 1] - klines[i].volume);
    } else {
      obv.push(obv[i - 1]);
    }
  }

  const current = obv[obv.length - 1];
  const previous = obv[obv.length - 10] ?? obv[0];

  let trend: "rising" | "falling" | "flat" = "flat";
  if (current > previous * 1.05) trend = "rising";
  else if (current < previous * 0.95) trend = "falling";

  const priceUp = klines[klines.length - 1].close > klines[klines.length - 10]?.close;
  let divergence: "bullish" | "bearish" | "none" = "none";
  if (!priceUp && trend === "rising") divergence = "bullish";
  else if (priceUp && trend === "falling") divergence = "bearish";

  let signal: -1 | 0 | 1 = 0;
  if (divergence === "bullish") signal = 1;
  else if (divergence === "bearish") signal = -1;
  else if (trend === "rising") signal = 1;
  else if (trend === "falling") signal = -1;

  return {
    current: Math.round(current),
    previous: Math.round(previous),
    trend,
    divergence,
    signal,
    label: trend === "rising" ? "↑ Rising" : trend === "falling" ? "↓ Falling" : "— Flat",
  };
}

// ── ATH/ATL Position ─────────────────────────────────────────────

export function calcATHATL(
  currentPrice: number,
  ath: number,
  athChangePct: number,
  athDate: string,
  atl: number,
  atlChangePct: number,
  atlDate: string,
): ATHATLResult {
  const distanceFromATH = ath > 0 ? ((currentPrice - ath) / ath) * 100 : 0;
  const distanceFromATL = atl > 0 ? ((currentPrice - atl) / atl) * 100 : 0;

  const midRange = ath > atl ? (ath + atl) / 2 : currentPrice;
  const midRangePct = midRange > 0 ? ((currentPrice - midRange) / midRange) * 100 : 0;

  let signal: -1 | 0 | 1 = 0;
  if (distanceFromATH > -5) signal = -1;
  else if (distanceFromATH < -70) signal = 1;
  else if (midRangePct < -30) signal = 1;
  else if (midRangePct > 30) signal = -1;

  const athAge = getAgeLabel(athDate);
  const atlAge = getAgeLabel(atlDate);

  return {
    athPrice: ath,
    athChangePct: Math.round(athChangePct * 10) / 10,
    athDate,
    atlPrice: atl,
    atlChangePct: Math.round(atlChangePct * 10) / 10,
    atlDate,
    distanceFromATH: Math.round(distanceFromATH * 10) / 10,
    distanceFromATL: Math.round(distanceFromATL * 10) / 10,
    midRangePct: Math.round(midRangePct * 10) / 10,
    signal,
    label: `ATH ${distanceFromATH.toFixed(0)}% | ATL +${distanceFromATL.toFixed(0)}%`,
  };
}

function getAgeLabel(dateStr: string): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1) return "today";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
