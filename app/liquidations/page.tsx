import { LiquidationsClient } from "@/components/liquidations/LiquidationsClient";

export default function LiquidationsPage() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <LiquidationsClient />
    </div>
  );
}
