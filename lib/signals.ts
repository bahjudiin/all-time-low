import {
  calcRSI,
  calcStochRSI,
  calcEMA,
  calcMACD,
  calcADX,
  calcBollinger,
  calcCCI,
  calcATR,
  calcOBV,
  calcATHATL,
} from "@/lib/indicators";
import type {
  BinanceKline,
  CoinSignals,
  IndicatorGroup,
  SignalDirection,
  BinanceFundingRate,
  BinanceLongShortRatio,
} from "@/types/signal";

function round(val: number): number {
  return Math.round(val * 100) / 100;
}

function buildGroup(
  name: string,
  signal: -1 | 0 | 1,
  indicators: { name: string; value: string; signal: -1 | 0 | 1 }[],
  agreed: boolean,
): IndicatorGroup {
  return { name, signal, indicators, agreed };
}

export function calcDerivativesIndicators(
  fundingRates: BinanceFundingRate[],
  openInterest: { current: string; time: number } | null,
  longShortData: {
    global: BinanceLongShortRatio[];
    topAccount: BinanceLongShortRatio[];
    topPosition: BinanceLongShortRatio[];
    taker: BinanceLongShortRatio[];
  },
  priceChange24h: number,
): {
  funding: import("@/types/signal").FundingRateResult;
  openInterest: import("@/types/signal").OpenInterestResult;
  longShort: import("@/types/signal").LongShortRatioResult;
} {
  let currentRate = 0;
  let rateSum8h = 0;
  let rateSum24h = 0;
  let count8h = 0;
  let count24h = 0;

  const now = Date.now();
  for (const fr of fundingRates) {
    if (fr.fundingTime > now - 24 * 60 * 60 * 1000) {
      rateSum24h += fr.fundingRate;
      count24h++;
    }
    if (fr.fundingTime > now - 8 * 60 * 60 * 1000) {
      rateSum8h += fr.fundingRate;
      count8h++;
    }
  }
  if (fundingRates.length > 0) {
    currentRate = fundingRates[fundingRates.length - 1].fundingRate;
  }

  const avg8h = count8h > 0 ? rateSum8h / count8h : 0;
  const avg24h = count24h > 0 ? rateSum24h / count24h : 0;

  let frTrend: "increasing" | "decreasing" | "stable" = "stable";
  if (avg8h > avg24h * 1.1) frTrend = "increasing";
  else if (avg8h < avg24h * 0.9) frTrend = "decreasing";

  let frSignal: -1 | 0 | 1 = 0;
  if (currentRate > 0.0001) frSignal = -1;
  else if (currentRate < -0.0001) frSignal = 1;

  const frResult: import("@/types/signal").FundingRateResult = {
    current: round(currentRate),
    average8h: round(avg8h),
    average24h: round(avg24h),
    trend: frTrend,
    signal: frSignal,
    label: `${(currentRate * 100).toFixed(4)}%`,
  };

  const oiCurrent = openInterest ? parseFloat(openInterest.current) : 0;
  const oiChange24h = oiCurrent > 0 && priceChange24h !== 0 ? priceChange24h : 0;

  let oiTrend: "increasing" | "decreasing" | "stable" = "stable";
  if (oiChange24h > 0) oiTrend = "increasing";
  else if (oiChange24h < 0) oiTrend = "decreasing";

  let oiSignal: -1 | 0 | 1 = 0;
  if (oiTrend === "increasing" && frSignal === -1) oiSignal = -1;
  else if (oiTrend === "increasing" && frSignal === 1) oiSignal = 1;

  const oiResult: import("@/types/signal").OpenInterestResult = {
    current: round(oiCurrent),
    change24hPct: round(oiChange24h),
    change7dPct: 0,
    trend: oiTrend,
    signal: oiSignal,
    label: `${oiChange24h > 0 ? "+" : ""}${oiChange24h.toFixed(2)}%`,
  };

  const globalRatio =
    longShortData.global.length > 0
      ? parseFloat(longShortData.global[longShortData.global.length - 1].longShortRatio)
      : 1;
  const topAccountRatio =
    longShortData.topAccount.length > 0
      ? parseFloat(longShortData.topAccount[longShortData.topAccount.length - 1].longShortRatio)
      : 1;
  const topPositionRatio =
    longShortData.topPosition.length > 0
      ? parseFloat(longShortData.topPosition[longShortData.topPosition.length - 1].longShortRatio)
      : 1;
  const takerRatio =
    longShortData.taker.length > 0
      ? parseFloat(longShortData.taker[longShortData.taker.length - 1].longShortRatio)
      : 1;

  let crowdBias: "long" | "short" | "neutral" = "neutral";
  if (globalRatio > 1.5) crowdBias = "long";
  else if (globalRatio < 0.67) crowdBias = "short";

  let whaleBias: "long" | "short" | "neutral" = "neutral";
  if (topAccountRatio > 1.5) whaleBias = "long";
  else if (topAccountRatio < 0.67) whaleBias = "short";

  let aggressorBias: "long" | "short" | "neutral" = "neutral";
  if (takerRatio > 1.5) aggressorBias = "long";
  else if (takerRatio < 0.67) aggressorBias = "short";

  let lsSignal: -1 | 0 | 1 = 0;
  const crowdVote = globalRatio > 1.5 ? -1 : globalRatio < 0.67 ? 1 : 0;
  const whaleVote = topAccountRatio < 0.67 ? -1 : topAccountRatio > 1.5 ? 1 : 0;
  const posVote = topPositionRatio > 1.5 ? -1 : topPositionRatio < 0.67 ? 1 : 0;
  const votes = [crowdVote, whaleVote, posVote].filter((v) => v !== 0);
  if (votes.length > 0) {
    const sum = votes.reduce((a, b) => a + b, 0);
    if (sum > 0) lsSignal = 1;
    else if (sum < 0) lsSignal = -1;
  }

  const lsResult: import("@/types/signal").LongShortRatioResult = {
    global: round(globalRatio),
    topAccount: round(topAccountRatio),
    topPosition: round(topPositionRatio),
    takerRatio: round(takerRatio),
    crowdBias,
    whaleBias,
    aggressorBias,
    signal: lsSignal,
    label: `G:${globalRatio.toFixed(2)} T:${topAccountRatio.toFixed(2)}`,
  };

  return { funding: frResult, openInterest: oiResult, longShort: lsResult };
}

export function computeSignals(
  closes: number[],
  klines: BinanceKline[],
  fundingRates: BinanceFundingRate[],
  openInterest: { current: string; time: number } | null,
  longShortData: {
    global: BinanceLongShortRatio[];
    topAccount: BinanceLongShortRatio[];
    topPosition: BinanceLongShortRatio[];
    taker: BinanceLongShortRatio[];
  },
  athAtlData: {
    currentPrice: number;
    ath: number;
    athChangePercentage: number;
    athDate: string;
    atl: number;
    atlChangePercentage: number;
    atlDate: string;
  },
): CoinSignals {
  const rsi = calcRSI(closes);
  const stochRsi = calcStochRSI(closes);
  const ema = calcEMA(closes);
  const macd = calcMACD(closes);
  const adx = calcADX(klines);
  const bollinger = calcBollinger(closes);
  const cci = calcCCI(klines);
  const atr = calcATR(klines);
  const obv = calcOBV(klines);

  const priceChange24h =
    closes.length >= 2 ? ((closes[closes.length - 1] - closes[closes.length - 2]) / closes[closes.length - 2]) * 100 : 0;

  const derivatives = calcDerivativesIndicators(fundingRates, openInterest, longShortData, priceChange24h);

  let momentumSignal: -1 | 0 | 1 = 0;
  if (rsi.signal === stochRsi.signal && rsi.signal !== 0) {
    momentumSignal = rsi.signal;
  } else if (rsi.signal !== 0 && stochRsi.signal !== 0 && rsi.signal !== stochRsi.signal) {
    momentumSignal = 0;
  } else {
    momentumSignal = rsi.signal !== 0 ? rsi.signal : stochRsi.signal;
  }
  const momentum = buildGroup(
    "Momentum",
    momentumSignal,
    [
      { name: "RSI(14)", value: String(rsi.value), signal: rsi.signal },
      { name: "StochRSI", value: `${stochRsi.k}/${stochRsi.d}`, signal: stochRsi.signal },
    ],
    momentumSignal !== 0 && rsi.signal === stochRsi.signal,
  );

  let trendSignal: -1 | 0 | 1 = 0;
  if (adx.adx < 15) {
    trendSignal = 0;
  } else if (ema.signal === macd.signal && adx.adx >= 25) {
    trendSignal = ema.signal;
  } else if (ema.signal === macd.signal && adx.adx >= 15) {
    trendSignal = ema.signal;
  } else {
    trendSignal = 0;
  }
  const trend = buildGroup(
    "Trend",
    trendSignal,
    [
      { name: "EMA 9/21", value: `${ema.fast}/${ema.slow}`, signal: ema.signal },
      { name: "MACD", value: macd.label, signal: macd.signal },
      { name: "ADX", value: adx.label, signal: adx.signal },
    ],
    trendSignal !== 0 && ema.signal === macd.signal && adx.adx >= 25,
  );

  let marketStructureSignal: -1 | 0 | 1 = 0;
  if (derivatives.openInterest.trend === "increasing") {
    if (derivatives.funding.signal === -1) marketStructureSignal = -1;
    else if (derivatives.funding.signal === 1) marketStructureSignal = 1;
  }

  const marketStructure = buildGroup(
    "Market Structure",
    marketStructureSignal,
    [
      { name: "Open Interest", value: derivatives.openInterest.label, signal: derivatives.openInterest.signal },
      { name: "Funding Rate", value: derivatives.funding.label, signal: derivatives.funding.signal },
    ],
    marketStructureSignal !== 0,
  );

  let crowdSignal: -1 | 0 | 1 = 0;
  const crowdVotes: (1 | -1)[] = [];
  if (derivatives.longShort.global > 1.5) crowdVotes.push(-1);
  else if (derivatives.longShort.global < 0.67) crowdVotes.push(1);
  if (derivatives.longShort.topAccount < 0.67) crowdVotes.push(-1);
  else if (derivatives.longShort.topAccount > 1.5) crowdVotes.push(1);
  if (derivatives.longShort.topPosition > 1.5) crowdVotes.push(-1);
  else if (derivatives.longShort.topPosition < 0.67) crowdVotes.push(1);

  if (crowdVotes.length > 0) {
    const posCount = crowdVotes.filter((v) => v === 1).length;
    const negCount = crowdVotes.filter((v) => v === -1).length;
    if (posCount > negCount) crowdSignal = 1;
    else if (negCount > posCount) crowdSignal = -1;
    else crowdSignal = 0;
  }

  const crowdSentiment = buildGroup(
    "Crowd Sentiment",
    crowdSignal,
    [
      { name: "Global L/S", value: derivatives.longShort.global.toFixed(2), signal: derivatives.longShort.global > 1.5 ? -1 : derivatives.longShort.global < 0.67 ? 1 : 0 },
      { name: "Top Account L/S", value: derivatives.longShort.topAccount.toFixed(2), signal: derivatives.longShort.topAccount < 0.67 ? -1 : derivatives.longShort.topAccount > 1.5 ? 1 : 0 },
      { name: "Top Position L/S", value: derivatives.longShort.topPosition.toFixed(2), signal: derivatives.longShort.topPosition > 1.5 ? -1 : derivatives.longShort.topPosition < 0.67 ? 1 : 0 },
    ],
    crowdSignal !== 0,
  );

  const lastVolume = klines.length > 0 ? klines[klines.length - 1].volume : 0;
  const avgVolume20 =
    klines.length >= 20
      ? klines.slice(-20).reduce((sum, k) => sum + k.volume, 0) / 20
      : lastVolume;
  const volumeSpike = avgVolume20 > 0 && lastVolume > avgVolume20 * 1.5;

  let volumeSignal: -1 | 0 | 1 = 0;
  if (volumeSpike) {
    if (obv.trend === "rising") volumeSignal = 1;
    else if (obv.trend === "falling") volumeSignal = -1;
  }

  const volumeFlow = buildGroup(
    "Volume Flow",
    volumeSignal,
    [
      { name: "OBV", value: obv.label, signal: obv.signal },
      { name: "Volume Spike", value: volumeSpike ? `${(lastVolume / avgVolume20).toFixed(1)}x` : "none", signal: volumeSpike ? (obv.trend === "rising" ? 1 : obv.trend === "falling" ? -1 : 0) : 0 },
    ],
    volumeSignal !== 0,
  );

  let confirmSignal: -1 | 0 | 1 = 0;
  if (
    (bollinger.position === "below_lower" || bollinger.position === "near_lower") &&
    cci.value < -100
  ) {
    confirmSignal = 1;
  } else if (
    (bollinger.position === "above_upper" || bollinger.position === "near_upper") &&
    cci.value > 100
  ) {
    confirmSignal = -1;
  }

  const confirmation = buildGroup(
    "Confirmation",
    confirmSignal,
    [
      { name: "Bollinger", value: bollinger.position.replace("_", " "), signal: bollinger.signal },
      { name: "CCI", value: cci.label, signal: cci.signal },
      { name: "ATR", value: atr.label, signal: 0 },
    ],
    confirmSignal !== 0,
  );

  const athAtlResult = calcATHATL(
    athAtlData.currentPrice,
    athAtlData.ath,
    athAtlData.athChangePercentage,
    athAtlData.athDate,
    athAtlData.atl,
    athAtlData.atlChangePercentage,
    athAtlData.atlDate,
  );

  let athAtlSignal: -1 | 0 | 1 = athAtlResult.signal;
  const athAtlGroup = buildGroup(
    "ATH/ATL Position",
    athAtlSignal,
    [
      { name: "From ATH", value: `${athAtlResult.distanceFromATH}%`, signal: athAtlResult.distanceFromATH > -5 ? -1 : athAtlResult.distanceFromATH < -70 ? 1 : 0 },
      { name: "From ATL", value: `+${athAtlResult.distanceFromATL}%`, signal: athAtlResult.distanceFromATL < 50 ? 1 : 0 },
      { name: "Mid Range", value: `${athAtlResult.midRangePct}%`, signal: athAtlResult.midRangePct < -30 ? 1 : athAtlResult.midRangePct > 30 ? -1 : 0 },
    ],
    athAtlSignal !== 0,
  );

  const groups = [momentum, trend, marketStructure, crowdSentiment, volumeFlow, confirmation, athAtlGroup];
  const score = groups.reduce((sum, g) => sum + g.signal, 0);

  let direction: SignalDirection = "wait";
  if (score >= 6) direction = "strong_long";
  else if (score >= 4) direction = "long";
  else if (score >= 2) direction = "lean_long";
  else if (score > -2) direction = "wait";
  else if (score > -4) direction = "lean_short";
  else if (score > -6) direction = "short";
  else direction = "strong_short";

  const nonZeroGroups = groups.filter((g) => g.signal !== 0);
  let agreementPct = 0;
  if (nonZeroGroups.length > 0) {
    const majorityDir = score >= 0 ? 1 : -1;
    const agreeCount = nonZeroGroups.filter((g) => g.signal === majorityDir).length;
    agreementPct = Math.round((agreeCount / nonZeroGroups.length) * 100);
  }

  return {
    momentum,
    trend,
    marketStructure,
    crowdSentiment,
    volumeFlow,
    confirmation,
    athAtlPosition: athAtlGroup,
    score,
    maxScore: 7,
    direction,
    agreementPct,
    athAtl: athAtlResult,
  };
}
