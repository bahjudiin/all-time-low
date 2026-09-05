export interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number | null;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
  sparkline_in_7d: {
    price: number[];
  };
}

export interface CoinDerived {
  pctToATH: number;
  volatilityProxy: number;
  liquidation24h: LiquidationData;
}

export interface LiquidationData {
  totalPct: number;
  longPct: number;
  shortPct: number;
  netDirection: "long" | "short" | "neutral";
}

export type CoinWithDerived = CoinMarket & CoinDerived;

export type SortDirection = "asc" | "desc";

export interface SortState {
  column: string;
  direction: SortDirection;
}

export interface Filters {
  marketCap: [number, number] | null;
  volume: [number, number] | null;
  pctFromATH: [number, number] | null;
  pctFromATL: [number, number] | null;
  athDateRange: [string, string] | null;
}

export type TabId = "all" | "gainers" | "losers" | "near-ath" | "near-atl" | "biggest-drop" | "biggest-pump" | "biggest-dump" | "ath-signals";

export interface ScreenerState {
  search: string;
  sort: SortState;
  filters: Filters;
  layout: "table" | "grid";
  currency: string;
  rowsPerPage: number;
  page: number;
  activeTab: TabId;
}
