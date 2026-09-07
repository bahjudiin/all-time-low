import type { SignalDirection } from "@/types/signal";

const BADGE_CONFIG: Record<SignalDirection, { label: string; color: string }> = {
  strong_long: { label: "STRONG LONG", color: "var(--long)" },
  long: { label: "LONG", color: "var(--long)" },
  lean_long: { label: "LEAN LONG", color: "var(--long)" },
  wait: { label: "WAIT", color: "var(--muted2)" },
  lean_short: { label: "LEAN SHORT", color: "var(--short)" },
  short: { label: "SHORT", color: "var(--short)" },
  strong_short: { label: "STRONG SHORT", color: "var(--short)" },
};

export function SignalBadge({ direction, score, maxScore }: { direction: SignalDirection; score: number; maxScore: number }) {
  const config = BADGE_CONFIG[direction];
  return (
    <span className="mono" style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", fontSize: 10, fontWeight: 700, color: config.color, border: `1px solid ${config.color}33`, borderRadius: 2 }}>
      {config.label}
      <span style={{ opacity: 0.6, fontWeight: 500 }}>
        {score > 0 ? "+" : ""}{score}/{maxScore}
      </span>
    </span>
  );
}
