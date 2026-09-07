"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export interface DropdownOption {
  value: string;
  label: string;
}

export function Dropdown({
  value,
  options,
  onChange,
  label,
  align = "left",
  size = "sm",
  className = "",
}: {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  label?: string;
  align?: "left" | "right";
  size?: "sm" | "md";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const listId = useId();

  const activeIndex = Math.max(0, options.findIndex((o) => o.value === value));

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); triggerRef.current?.focus(); } };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  useEffect(() => { if (open) optionRefs.current[activeIndex]?.focus(); }, [open, activeIndex]);

  const closeAndSelect = (opt: DropdownOption) => { onChange(opt.value); setOpen(false); triggerRef.current?.focus(); };

  const moveFocus = (dir: 1 | -1) => {
    const els = optionRefs.current;
    if (!els.length) return;
    const current = document.activeElement;
    const idx = els.indexOf(current as HTMLButtonElement | null);
    const next = idx === -1 ? (dir === 1 ? 0 : els.length - 1) : Math.min(els.length - 1, Math.max(0, idx + dir));
    els[next]?.focus();
  };

  const active = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative inline-flex items-center gap-1 ${className}`}>
      {label && <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>{label}</span>}
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={label ? `${label}${active ? `: ${active.label}` : ""}` : active?.label}
        onClick={() => { setOpen((o) => !o); if (!open) optionRefs.current[activeIndex]?.focus(); }}
        onKeyDown={(e) => { if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); if (!open) setOpen(true); else moveFocus(e.key === "ArrowDown" ? 1 : -1); } }}
        className="mono"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: size === "sm" ? "3px 8px" : "4px 10px",
          fontSize: size === "sm" ? 10 : 11,
          border: "1px solid var(--hair)",
          borderRadius: 2,
          background: "var(--panel)",
          color: "var(--ink-secondary)",
          cursor: "pointer",
        }}
      >
        <span>{active?.label ?? value}</span>
        <ChevronDown style={{ width: 12, height: 12, color: "var(--muted)", transition: "transform 0.15s", transform: open ? "rotate(180deg)" : undefined }} />
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          style={{
            position: "absolute",
            top: "100%",
            marginTop: 4,
            zIndex: 50,
            minWidth: "9rem",
            maxHeight: 256,
            overflow: "auto",
            borderRadius: 2,
            border: "1px solid var(--hair)",
            background: "var(--panel)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            padding: "4px 0",
            ...(align === "right" ? { right: 0 } : { left: 0 }),
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); moveFocus(e.key === "ArrowDown" ? 1 : -1); }
            else if (e.key === "Home") { e.preventDefault(); optionRefs.current[0]?.focus(); }
            else if (e.key === "End") { e.preventDefault(); optionRefs.current[optionRefs.current.length - 1]?.focus(); }
            else if (e.key === "Enter" || e.key === " ") {
              const idx = optionRefs.current.indexOf(document.activeElement as HTMLButtonElement | null);
              if (idx >= 0) closeAndSelect(options[idx]);
            }
          }}
        >
          {options.map((o, i) => (
            <li key={o.value}>
              <button
                ref={(el) => { optionRefs.current[i] = el; }}
                type="button"
                role="option"
                aria-selected={o.value === value}
                onClick={() => closeAndSelect(o)}
                className="mono"
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "4px 12px",
                  fontSize: 11,
                  border: "none",
                  background: o.value === value ? "var(--amber)" : "none",
                  color: o.value === value ? "var(--ink)" : "var(--ink-secondary)",
                  cursor: "pointer",
                  fontWeight: o.value === value ? 700 : 400,
                }}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
