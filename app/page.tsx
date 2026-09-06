import type { Metadata } from "next";
import { fetchCoinsMarkets } from "@/lib/coingecko";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "ATH/ATL Tracker",
  description: "Real-time crypto ATH/ATL tracker with predictive signals",
};

export const revalidate = 60;

export default async function Home() {
  let coins: Awaited<ReturnType<typeof fetchCoinsMarkets>> = [];
  try {
    coins = await fetchCoinsMarkets("usd", 250, 1);
  } catch (e) {
    console.error("Failed to fetch coins:", e);
  }

  return <AppShell initialCoins={coins} />;
}