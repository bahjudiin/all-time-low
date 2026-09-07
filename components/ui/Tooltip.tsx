"use client";

import { useId, useRef, useState, useCallback } from "react";

export function Tooltip({
  label,
  children,
  side = "top",
  className = "",
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}) {
  const id = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const show = useCallback(() => {
    setVisible(true);
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const tipStyle: React.CSSProperties = {};
    if (side === "top" || side === "bottom") {
      const left = rect.left + rect.width / 2;
      const clampedLeft = Math.max(8, Math.min(left, window.innerWidth - 8));
      tipStyle.left = clampedLeft;
      tipStyle.transform = "translateX(-50%)";
    } else {
      const top = rect.top + rect.height / 2;
      const clampedTop = Math.max(8, Math.min(top, window.innerHeight - 8));
      tipStyle.top = clampedTop;
      tipStyle.transform = "translateY(-50%)";
    }
    setStyle(tipStyle);
  }, [side]);

  if (!label) return <span className={className}>{children}</span>;

  const pos: Record<string, React.CSSProperties> = {
    top: { bottom: "100%", left: "50%", transform: "translateX(-50%)", marginBottom: 6 },
    bottom: { top: "100%", left: "50%", transform: "translateX(-50%)", marginTop: 6 },
    left: { right: "100%", top: "50%", transform: "translateY(-50%)", marginRight: 6 },
    right: { left: "100%", top: "50%", transform: "translateY(-50%)", marginLeft: 6 },
  };

  return (
    <span
      ref={triggerRef}
      className={className}
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={show}
      onMouseLeave={() => setVisible(false)}
      onFocus={show}
      onBlur={() => setVisible(false)}
      aria-describedby={id}
    >
      {children}
      {visible && (
        <span
          id={id}
          role="tooltip"
          className="mono"
          style={{
            position: "absolute",
            zIndex: 50,
            whiteSpace: "nowrap",
            padding: "4px 8px",
            fontSize: 10,
            lineHeight: 1.3,
            color: "var(--ink-primary)",
            background: "var(--panel-raised)",
            borderRadius: 2,
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            border: "1px solid var(--hair)",
            pointerEvents: "none",
            maxWidth: 240,
            ...pos[side],
            ...style,
          }}
        >
          {label}
        </span>
      )}
    </span>
  );
}
