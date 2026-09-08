import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "ATH/ATL Tracker — Real-Time Crypto Intelligence",
  description:
    "Track all-time highs, all-time lows, liquidation cascades, and predictive signals across 250+ crypto assets. Live from Binance, OKX & Bybit.",
};

export default function Home() {
  redirect("/dashboard");
}
