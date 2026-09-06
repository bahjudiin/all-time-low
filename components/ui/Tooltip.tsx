"use client";

import { useId } from "react";

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
  const pos: Record<string, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
    left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
    right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
  };
  return (
    <span className={`relative inline-flex group ${className}`}>
      {children}
      <span
        role="tooltip"
        aria-describedby={id}
        className={`absolute ${pos[side]} z-50 hidden group-hover:inline-flex whitespace-nowrap px-2 py-1 text-[11px] leading-tight font-normal text-zinc-100 bg-zinc-900 dark:bg-zinc-700 rounded-md shadow-lg border border-zinc-700 dark:border-zinc-600 pointer-events-none max-w-[240px]`}
      >
        {label}
      </span>
    </span>
  );
}