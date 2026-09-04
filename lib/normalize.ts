import type { LiquidationEvent } from "@/types/liquidation";

export interface BinanceForceOrder {
  e: string;
  E: number;
  s: string;
  o: {
    s: string;
    S: "BUY" | "SELL";
    o: string;
    f: string;
    q: string;
    p: string;
    ap: string;
    X: string;
    l: string;
    m: boolean;
    T: number;
  };
}

export type BinanceForceOrderRest = BinanceForceOrder;

export interface OKXLiquidationOrder {
  instId: string;
  instType: string;
  bkPx: string;
  bz: string;
  side: "buy" | "sell";
  ts: string;
}

const OKX_CONTRACT_MULTIPLIER: Record<string, number> = {
  BTC: 0.01,
  ETH: 0.1,
  SOL: 1,
  XRP: 100,
  DOGE: 1000,
  ADA: 100,
  AVAX: 1,
  DOT: 1,
  LINK: 1,
  MATIC: 100,
  UNI: 1,
  FIL: 1,
  NEAR: 10,
  APT: 1,
  ARB: 10,
  OP: 10,
  SUI: 1,
  INJ: 1,
  TIA: 1,
  PEPE: 1000000,
};

function generateId(exchange: string, ts: number, symbol: string): string {
  return `${exchange}-${ts}-${symbol}-${Math.random().toString(36).slice(2, 8)}`;
}

export function deriveSymbolFromBinance(nativeSymbol: string): string {
  const usdtIdx = nativeSymbol.indexOf("USDT");
  if (usdtIdx > 0) return nativeSymbol.slice(0, usdtIdx);
  return nativeSymbol;
}

export function deriveSymbolFromOKX(instId: string): string {
  const parts = instId.split("-");
  return parts[0];
}

export function estimateUsdValue(price: number, qty: number, symbol: string): number {
  const multiplier = OKX_CONTRACT_MULTIPLIER[symbol];
  if (multiplier) return price * qty * multiplier;
  return price * qty;
}

export function normalizeBinanceLiq(raw: BinanceForceOrder): LiquidationEvent {
  const symbol = deriveSymbolFromBinance(raw.s);
  const side = raw.o.S === "SELL" ? "long" : "short";
  const price = parseFloat(raw.o.ap) || parseFloat(raw.o.p);
  const qty = parseFloat(raw.o.q);
  const usdValue = estimateUsdValue(price, qty, symbol);

  return {
    id: generateId("binance", raw.E, symbol),
    ts: raw.E,
    symbol,
    exchange: "binance",
    side,
    qty,
    price,
    usdValue,
  };
}

export function normalizeBinanceRestLiq(raw: BinanceForceOrderRest[]): LiquidationEvent[] {
  return raw.map(normalizeBinanceLiq);
}

export function normalizeOKXLiq(raw: OKXLiquidationOrder): LiquidationEvent {
  const symbol = deriveSymbolFromOKX(raw.instId);
  const side = raw.side === "sell" ? "long" : "short";
  const price = parseFloat(raw.bkPx);
  const qty = parseFloat(raw.bz);
  const ts = parseInt(raw.ts);
  const usdValue = estimateUsdValue(price, qty, symbol);

  return {
    id: generateId("okx", ts, symbol),
    ts,
    symbol,
    exchange: "okx",
    side,
    qty,
    price,
    usdValue,
  };
}
