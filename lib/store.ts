import { create } from "zustand";
import type { ScreenerState, SortState, Filters, TabId } from "@/types/coin";

const initialFilters: Filters = {
  marketCap: null,
  volume: null,
  pctFromATH: null,
  pctFromATL: null,
  athDateRange: null,
};

const initialSort: SortState = {
  column: "market_cap",
  direction: "desc",
};

export const useScreenerStore = create<ScreenerState>(() => ({
  search: "",
  sort: initialSort,
  filters: initialFilters,
  layout: "table",
  currency: "usd",
  rowsPerPage: 100,
  page: 0,
  activeTab: "near-ath",
}));

export function setSearch(search: string) {
  useScreenerStore.setState({ search, page: 0 });
}

export function setSort(column: string, direction: "asc" | "desc") {
  useScreenerStore.setState({ sort: { column, direction } });
}

export function setFilters(filters: Partial<Filters>) {
  useScreenerStore.setState((s) => ({
    filters: { ...s.filters, ...filters },
    page: 0,
  }));
}

export function clearFilters() {
  useScreenerStore.setState({ filters: initialFilters, page: 0 });
}

export function setLayout(layout: "table" | "grid") {
  useScreenerStore.setState({ layout });
}

export function setCurrency(currency: string) {
  useScreenerStore.setState({ currency, page: 0 });
}

export function setRowsPerPage(rowsPerPage: number) {
  useScreenerStore.setState({ rowsPerPage, page: 0 });
}

export function setPage(page: number) {
  useScreenerStore.setState({ page });
}

export function setActiveTab(tab: TabId) {
  useScreenerStore.setState({ activeTab: tab, page: 0 });
}
