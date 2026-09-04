import type { SignalDirection } from "@/types/signal";

const BADGE_CONFIG: Record<SignalDirection, { label: string; bg: string; text: string; ring: string }> = {
  strong_long: { label: "STRONG LONG", bg: "bg-emerald-500/15", text: "text-emerald-400", ring: "ring-emerald-500/30" },
  long: { label: "LONG", bg: "bg-emerald-500/10", text: "text-emerald-400", ring: "ring-emerald-500/20" },
  lean_long: { label: "LEAN LONG", bg: "bg-emerald-500/5", text: "text-emerald-300", ring: "ring-emerald-500/10" },
  wait: { label: "WAIT", bg: "bg-zinc-500/10", text: "text-zinc-400", ring: "ring-zinc-500/20" },
  lean_short: { label: "LEAN SHORT", bg: "bg-red-500/5", text: "text-red-300", ring: "ring-red-500/10" },
  short: { label: "SHORT", bg: "bg-red-500/10", text: "text-red-400", ring: "ring-red-500/20" },
  strong_short: { label: "STRONG SHORT", bg: "bg-red-500/15", text: "text-red-400", ring: "ring-red-500/30" },
};

export function SignalBadge({ direction, score, maxScore }: { direction: SignalDirection; score: number; maxScore: number }) {
  const config = BADGE_CONFIG[direction];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ring-1 ${config.bg} ${config.text} ${config.ring}`}>
      {config.label}
      <span className="opacity-60 font-medium">
        {score > 0 ? "+" : ""}{score}/{maxScore}
      </span>
    </span>
  );
}
