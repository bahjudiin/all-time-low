"use client";

export interface GlanceMetric {
  label: string;
  value: string;
  color?: string;
}

export function MarketGlanceStrip({
  metrics,
  children,
}: {
  metrics: GlanceMetric[];
  children?: React.ReactNode;
}) {
  return (
    <div className="px-4 md:px-6 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
      <div className="flex items-center gap-4 md:gap-6 overflow-x-auto">
        {metrics.map((m) => (
          <div key={m.label} className="whitespace-nowrap">
            <span className="text-zinc-500 text-[11px]">{m.label} </span>
            <span className={`font-mono text-xs font-medium ${m.color ?? "text-foreground"}`}>
              {m.value}
            </span>
          </div>
        ))}
        {children}
      </div>
    </div>
  );
}