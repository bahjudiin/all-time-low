import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "ATH/ATL Tracker — Real-Time Crypto Intelligence",
  description:
    "Track all-time highs, all-time lows, liquidation cascades, and predictive signals across 250+ crypto assets. Live from Binance, OKX & Bybit.",
  openGraph: {
    title: "ATH/ATL Tracker",
    description: "Real-time crypto ATH/ATL tracker with predictive signals",
    type: "website",
  },
};

export default function Home() {
  return <LandingPage />;
}
