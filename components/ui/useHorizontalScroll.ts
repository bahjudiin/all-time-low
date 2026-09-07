"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Adds drag-to-scroll + overflow detection to a horizontally scrollable
 * container. Returns refs/flags for fade-edge indicators.
 */
export function useHorizontalScroll<El extends HTMLElement>() {
  const ref = useRef<El>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    const left = el.scrollLeft > 1;
    setCanScroll(el.scrollWidth > el.clientWidth + 1);
    setCanScrollLeft(left);
    setCanScrollRight(right);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [update]);

  // Drag to scroll (mouse only; touch has native momentum scroll)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let down = false;
    let startX = 0;
    let startScrollLeft = 0;

    const onDown = (e: MouseEvent) => {
      // Drag with left mouse on non-interactive targets only
      if (e.button !== 0) return;
      const t = e.target as HTMLElement;
      if (t.closest("button, a, input, [role='button']")) return;
      down = true;
      startX = e.clientX;
      startScrollLeft = el.scrollLeft;
      el.classList.add("drag-scroll");
    };

    const onMove = (e: MouseEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      el.scrollLeft = startScrollLeft - dx;
    };

    const onUp = () => {
      down = false;
      el.classList.remove("drag-scroll");
    };

    el.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      el.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      el.classList.remove("drag-scroll");
    };
  }, []);

  const scrollByAmount = useCallback((dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.6, 120);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }, []);

  return { ref, canScroll, canScrollLeft, canScrollRight, scrollByAmount };
}