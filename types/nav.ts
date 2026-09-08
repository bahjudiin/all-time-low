import type { OvervaluedUndervaluedResult } from "@/lib/overvaluedUndervalued";

export type NavTabId = "ath-atl" | "over-under" | "settings";

export type AthAtlSubTab = "near-ath" | "near-atl" | "signals";
export type OverUnderSubTab = "overvalued" | "undervalued" | "extreme" | "entry-near" | "high-conf" | "signals";

export interface NavItem {
  id: NavTabId;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "ath-atl", label: "ATH / ATL" },
  { id: "over-under", label: "Over / Under" },
  { id: "settings", label: "Settings" },
];

export interface CoinDetailExtra {
  overvalued?: OvervaluedUndervaluedResult;
  signals?: unknown;
}
