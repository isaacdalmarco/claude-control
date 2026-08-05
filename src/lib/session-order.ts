const ORDER_KEY = "sessionOrder";

/** Sort by a saved id order; ids the order doesn't know keep their relative position, last. */
export function applyOrder<T extends { id: string }>(sessions: T[], order: string[]): T[] {
  if (order.length === 0) return sessions;
  const rank = new Map(order.map((id, i) => [id, i]));
  const unranked = order.length;
  return [...sessions].sort((a, b) => (rank.get(a.id) ?? unranked) - (rank.get(b.id) ?? unranked));
}

/** Move dragged in front of target, keeping every other id where it was. */
export function reorder(ids: string[], draggedId: string, targetId: string): string[] {
  const next = ids.filter((id) => id !== draggedId);
  const at = next.indexOf(targetId);
  next.splice(at < 0 ? next.length : at, 0, draggedId);
  return next;
}

export function loadOrder(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = JSON.parse(localStorage.getItem(ORDER_KEY) ?? "[]");
    return Array.isArray(saved) ? saved.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function saveOrder(ids: string[]): void {
  localStorage.setItem(ORDER_KEY, JSON.stringify(ids));
}
