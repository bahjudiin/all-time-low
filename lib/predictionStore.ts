import { create } from "zustand";
import type {
  PredictionStoreState,
  PredictionRecord,
  CoinPrediction,
  PredictionFilters,
  PredictionSortColumn,
} from "@/types/prediction";

const initialFilters: PredictionFilters = {
  direction: "all",
  quality: "all",
  state: "all",
  minExhaustion: 0,
};

export const usePredictionStore = create<PredictionStoreState>((set) => ({
  predictions: [],
  selectedSymbol: null,
  filters: initialFilters,
  sortColumn: "exhaustionProbability" as PredictionSortColumn,
  sortDirection: "desc" as const,
  history: [],
  isScanning: false,
  lastScanTime: 0,
  viewMode: "table",

  setPredictions: (predictions: CoinPrediction[]) =>
    set({ predictions, lastScanTime: Date.now() }),

  updatePrediction: (symbol: string, update: Partial<CoinPrediction>) =>
    set((state) => ({
      predictions: state.predictions.map((p) =>
        p.symbol === symbol ? { ...p, ...update } : p
      ),
    })),

  setSelectedSymbol: (symbol: string | null) =>
    set({ selectedSymbol: symbol }),

  setFilters: (filters: Partial<PredictionFilters>) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  setSort: (column: PredictionSortColumn, direction: "asc" | "desc") =>
    set({ sortColumn: column, sortDirection: direction }),

  setViewMode: (mode: "table" | "cards") =>
    set({ viewMode: mode }),

  addHistoryRecord: (record: PredictionRecord) =>
    set((state) => ({
      history: [record, ...state.history].slice(0, 500),
    })),

  setScanning: (scanning: boolean) =>
    set({ isScanning: scanning }),
}));
