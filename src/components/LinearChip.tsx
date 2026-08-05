"use client";

import { linearUrl } from "@/lib/linear";
import { openUrl } from "./PrStatusBadge";

export function LinearChip({ ticketId, url }: { ticketId: string; url?: string | null }) {
  return (
    <span
      onClick={(e) => openUrl(e, url || linearUrl(ticketId))}
      className="has-tooltip shrink-0 inline-flex items-center gap-1 px-1.5 py-px rounded-sm border border-indigo-500/25 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 text-[9px] font-medium font-(family-name:--font-geist-mono) cursor-pointer transition-colors"
      data-tip="Open in Linear"
    >
      <svg className="w-2.5 h-2.5" viewBox="0 0 100 100" fill="currentColor">
        <path d="M1.2 61.5a49 49 0 0 0 37.3 37.3L1.2 61.5ZM.1 49.6l50.3 50.3c2.8 0 5.6-.3 8.3-.8L.9 41.3c-.5 2.7-.8 5.5-.8 8.3ZM3.9 34.4l61.7 61.7c2-.8 4-1.7 5.9-2.8L6.7 28.5c-1.1 1.9-2 3.9-2.8 5.9ZM12 21.9l66.1 66.1a50.3 50.3 0 0 0 10-10L22 11.9a50.3 50.3 0 0 0-10 10Z" />
      </svg>
      {ticketId}
    </span>
  );
}
