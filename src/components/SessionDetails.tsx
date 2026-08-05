"use client";

import { useState } from "react";
import { extractTicketId } from "@/lib/linear";
import { approvalMessage, ChipTone, prStateChip } from "@/lib/pr-chip";
import { ClaudeSession, PrStatus, Teammate } from "@/lib/types";
import { LinearChip } from "./LinearChip";
import { openUrl, prLabel } from "./PrStatusBadge";

function joinedAgo(joinedAt: number | null): string {
  if (!joinedAt) return "";
  const minutes = Math.floor((Date.now() - joinedAt) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function ChecksIcon({ pr }: { pr: PrStatus | null | undefined }) {
  if (!pr || pr.checks === "none") {
    return <span className="w-3 h-3 shrink-0 rounded-full border border-white/15" />;
  }
  if (pr.checks === "pending") {
    return (
      <span className="w-3 h-3 shrink-0 rounded-full border-[1.5px] border-amber-400 border-t-transparent animate-spin" />
    );
  }
  const failing = pr.checks === "failing";
  return (
    <svg
      className={`w-3 h-3 shrink-0 ${failing ? "text-red-400" : "text-emerald-400"}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d={failing ? "M6 18L18 6M6 6l12 12" : "M4.5 12.75l6 6 9-13.5"}
      />
    </svg>
  );
}

function TeammateRow({ teammate }: { teammate: Teammate }) {
  const running = teammate.pid !== null;
  return (
    <div className="flex items-center gap-2 text-[11px] py-1">
      <span className={`w-1.5 h-1.5 shrink-0 rounded-full ${running ? "bg-emerald-500" : "bg-zinc-700"}`} />
      <span className={`truncate ${running ? "text-zinc-300" : "text-zinc-500"}`}>{teammate.name}</span>
      <span className="shrink-0 text-zinc-600 font-(family-name:--font-geist-mono) text-[10px]">
        {teammate.agentType}
      </span>
      <span className="ml-auto shrink-0 text-zinc-600 text-[10px]">
        {running ? joinedAgo(teammate.joinedAt) : "exited"}
      </span>
    </div>
  );
}

const chipTones: Record<ChipTone, string> = {
  green: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
  purple: "border-violet-500/25 bg-violet-500/10 text-violet-400",
  red: "border-red-500/25 bg-red-500/10 text-red-400",
  amber: "border-amber-500/25 bg-amber-500/10 text-amber-400",
  zinc: "border-white/10 bg-white/5 text-zinc-400",
};

function StateChip({ pr }: { pr: PrStatus }) {
  const chip = prStateChip(pr);
  return (
    <span
      className={`shrink-0 px-1.5 py-px rounded-full border text-[9px] font-medium whitespace-nowrap ${chipTones[chip.tone]}`}
    >
      {chip.label}
    </span>
  );
}

function CopyApprovalButton({ url, title }: { url: string; title: string | null | undefined }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(approvalMessage(url, title)).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="has-tooltip shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors"
      data-tip={copied ? "Copied" : "Copy approval message"}
    >
      {copied ? (
        <svg
          className="w-3 h-3 text-emerald-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
          />
        </svg>
      )}
    </button>
  );
}

function PrRow({ url, pr }: { url: string; pr: PrStatus | null | undefined }) {
  const ticketId = extractTicketId(pr?.headRefName, pr?.title);
  return (
    <div
      onClick={(e) => openUrl(e, url)}
      className="group flex items-center gap-2 text-[11px] py-1 cursor-pointer"
      title={url}
    >
      <ChecksIcon pr={pr} />
      <CopyApprovalButton url={url} title={pr?.title} />
      <span className="truncate text-zinc-300 group-hover:text-blue-300 font-(family-name:--font-geist-mono)">
        {prLabel(url)}
      </span>
      {ticketId && <LinearChip ticketId={ticketId} />}
      {pr && <StateChip pr={pr} />}
      {pr?.checksDetail && (
        <span className="shrink-0 text-zinc-600 font-(family-name:--font-geist-mono) text-[10px]">
          {pr.checksDetail.passing}/{pr.checksDetail.total}
        </span>
      )}
      {pr && (pr.additions > 0 || pr.deletions > 0) && (
        <span className="shrink-0 flex items-center gap-1 font-(family-name:--font-geist-mono) text-[10px]">
          <span className="text-emerald-500">+{pr.additions}</span>
          <span className="text-red-400">-{pr.deletions}</span>
        </span>
      )}
      {pr && pr.unresolvedThreads > 0 && (
        <span className="ml-auto shrink-0 inline-flex items-center gap-1 text-amber-400" title="Unresolved comments">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
            />
          </svg>
          <span className="font-mono font-medium">{pr.unresolvedThreads}</span>
        </span>
      )}
    </div>
  );
}

/** Expanded card body: the session's teammates and every PR it owns. */
export function SessionDetails({
  session,
  prStatuses,
}: {
  session: ClaudeSession;
  prStatuses?: Record<string, PrStatus | null>;
}) {
  return (
    <div className="mb-3 grid gap-2 sm:grid-cols-2 items-start">
      {session.teammates.length > 0 && (
        <div className="rounded-lg border border-white/6 bg-white/2 px-2.5 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-600 mb-0.5">
            Teammates ({session.teammates.length})
          </div>
          {session.teammates.map((teammate) => (
            <TeammateRow key={teammate.agentId} teammate={teammate} />
          ))}
        </div>
      )}

      {session.prs.length > 0 && (
        <div className="rounded-lg border border-white/6 bg-white/2 px-2.5 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-600 mb-0.5">
            Pull requests ({session.prs.length})
          </div>
          {session.prs.map((url) => (
            <PrRow key={url} url={url} pr={prStatuses?.[url]} />
          ))}
        </div>
      )}
    </div>
  );
}
