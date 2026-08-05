"use client";

import { ChipTone, PrChip } from "@/lib/pr-chip";

const chipTones: Record<ChipTone, string> = {
  green: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
  purple: "border-violet-500/25 bg-violet-500/10 text-violet-400",
  red: "border-red-500/25 bg-red-500/10 text-red-400",
  amber: "border-amber-500/25 bg-amber-500/10 text-amber-400",
  zinc: "border-white/10 bg-white/5 text-zinc-400",
};

export function StateChip({ chip }: { chip: PrChip }) {
  return (
    <span
      className={`shrink-0 px-1.5 py-px rounded-full border text-[9px] font-medium whitespace-nowrap ${chipTones[chip.tone]}`}
    >
      {chip.label}
    </span>
  );
}
