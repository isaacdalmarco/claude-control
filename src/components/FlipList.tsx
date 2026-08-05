"use client";

import { useLayoutEffect, useRef } from "react";

const DURATION_MS = 160;

/**
 * Animates children sliding to their new positions when `order` changes (FLIP:
 * measure the old offset, jump back to it, then transition to zero).
 */
export function FlipList({
  order,
  className,
  children,
}: {
  order: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const offsets = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    const container = ref.current;
    if (!container) return;

    const next = new Map<string, number>();
    for (const child of Array.from(container.children) as HTMLElement[]) {
      const key = child.dataset.flipKey;
      if (!key) continue;

      const top = child.offsetTop;
      next.set(key, top);

      const previous = offsets.current.get(key);
      if (previous === undefined || previous === top) continue;

      child.style.transition = "none";
      child.style.transform = `translateY(${previous - top}px)`;
      requestAnimationFrame(() => {
        child.style.transition = `transform ${DURATION_MS}ms ease`;
        child.style.transform = "";
      });
    }
    offsets.current = next;
  }, [order]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
