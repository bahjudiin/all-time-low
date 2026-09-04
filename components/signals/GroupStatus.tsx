import type { IndicatorGroup } from "@/types/signal";

export function GroupStatus({ group }: { group: IndicatorGroup }) {
  const dotColor =
    group.signal === 1
      ? "bg-emerald-400"
      : group.signal === -1
        ? "bg-red-400"
        : "bg-zinc-600";

  const signalIcon = (s: -1 | 0 | 1) =>
    s === 1 ? "▲" : s === -1 ? "▼" : "—";

  return (
    <div className="py-1.5">
      <div className="flex items-center gap-2 mb-0.5">
        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider flex-1">
          {group.name}
        </span>
        {group.agreed && (
          <span className="text-[9px] text-emerald-400/80 font-medium">AGREE</span>
        )}
      </div>
      <div className="ml-3.5 space-y-0.5">
        {group.indicators.map((ind) => {
          const indColor =
            ind.signal === 1
              ? "text-emerald-400"
              : ind.signal === -1
                ? "text-red-400"
                : "text-zinc-500";
          return (
            <div key={ind.name} className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-zinc-500 truncate">{ind.name}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-[10px] font-mono ${indColor}`}>{ind.value}</span>
                <span className={`text-[9px] ${indColor}`}>{signalIcon(ind.signal)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
