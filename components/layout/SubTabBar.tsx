"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useHorizontalScroll } from "@/components/ui/useHorizontalScroll";

interface SubTabBarProps<T extends string> {
  tabs: { id: T; label: string; onClick?: () => void }[];
  active: T;
  onChange: (id: T) => void;
}

export function SubTabBar<T extends string>({
  tabs,
  active,
  onChange,
}: SubTabBarProps<T>) {
  const { ref, canScroll, canScrollLeft, canScrollRight, scrollByAmount } =
    useHorizontalScroll<HTMLDivElement>();

  return (
    <div className="relative px-4 md:px-6 py-2 border-b border-border bg-surface-base">
      <div
        ref={ref}
        role="tablist"
        className="flex items-center gap-1.5 min-w-max scroll-snap-x"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            id={`subtab-${tab.id}`}
            aria-controls={`tabpanel-${tab.id}`}
            onClick={() => {
              onChange(tab.id);
              tab.onClick?.();
            }}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap ${
              active === tab.id
                ? "bg-accent text-white shadow-sm"
                : "text-text-tertiary hover:text-text-secondary hover:bg-surface-hover"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Fade edges when scrollable */}
      {canScrollLeft && (
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-surface-base to-transparent" />
      )}
      {canScrollRight && (
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-surface-base to-transparent" />
      )}

      {/* Paging arrows on desktop */}
      {canScroll && (
        <>
          <button
            aria-label="Scroll tabs left"
            tabIndex={-1}
            onClick={() => scrollByAmount(-1)}
            className={`hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 items-center justify-center rounded-full border border-border bg-surface-base shadow-sm hover:bg-surface-hover transition-opacity ${
              canScrollLeft
                ? "opacity-100 text-text-secondary"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            aria-label="Scroll tabs right"
            tabIndex={-1}
            onClick={() => scrollByAmount(1)}
            className={`hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 items-center justify-center rounded-full border border-border bg-surface-base shadow-sm hover:bg-surface-hover transition-opacity ${
              canScrollRight
                ? "opacity-100 text-text-secondary"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  );
}