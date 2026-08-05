"use client";

import { useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import { ClaudeSession, PrStatus, SessionStatus, statusLabels } from "@/lib/types";
import { SessionDetails } from "./SessionDetails";

const statusColors: Record<SessionStatus, { dot: string; text: string }> = {
  working: { dot: "bg-emerald-500", text: "text-emerald-400" },
  idle: { dot: "bg-amber-500", text: "text-amber-400" },
  waiting: { dot: "bg-blue-500", text: "text-blue-400" },
  errored: { dot: "bg-red-500", text: "text-red-400" },
  finished: { dot: "bg-zinc-600", text: "text-zinc-500" },
};

export function SessionRow({
  session,
  selected,
  shortcutNumber,
  prStatuses,
  onSelect,
  displayStatus,
  isStale,
  onApproveReject,
}: {
  session: ClaudeSession;
  selected?: boolean;
  shortcutNumber?: number;
  prStatuses?: Record<string, PrStatus | null>;
  onSelect?: () => void;
  displayStatus: SessionStatus;
  isStale?: boolean;
  onApproveReject?: (action: "approve" | "reject") => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { editorAvailable } = useSettings();
  const colors = isStale ? { dot: "bg-zinc-500", text: "text-zinc-400" } : statusColors[displayStatus];
  const label = isStale ? "Stale" : statusLabels[displayStatus];
  const isWaiting = displayStatus === "waiting";

  const repoLabel =
    session.isWorktree && session.parentRepo
      ? session.workingDirectory.split("/").filter(Boolean).pop() || session.repoName
      : session.repoName || "Unknown";

  return (
    <div>
      <div
        onClick={onSelect}
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-100 ${
          selected
            ? "bg-blue-500/8 border border-blue-400/30 shadow-[0_0_20px_rgba(96,165,250,0.1)]"
            : "bg-white/2 border border-transparent hover:bg-white/4 hover:border-white/6"
        } ${isStale && !selected ? "opacity-55 hover:opacity-100" : ""}`}
      >
        {/* Shortcut number */}
        {shortcutNumber !== undefined && (
          <span
            className={`shrink-0 flex items-center justify-center rounded-sm font-bold font-(family-name:--font-geist-mono) ${
              selected
                ? "w-5 h-5 text-[10px] bg-blue-500 text-white"
                : "w-5 h-5 text-[10px] bg-white/4 border border-white/6 text-zinc-600"
            }`}
          >
            {shortcutNumber}
          </span>
        )}

        {/* Status dot + label */}
        <div className="shrink-0 flex items-center gap-2 w-[140px]">
          <span className="relative flex h-2 w-2 shrink-0">
            {!isStale && displayStatus === "working" && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
            )}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${colors.dot}`} />
          </span>
          <span className={`text-xs font-medium ${colors.text}`}>{label}</span>
          {session.orphaned && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-orange-400">Orphaned</span>
          )}
        </div>

        {/* Session title, with the repo it runs in underneath */}
        <div className="min-w-0 flex-1 flex items-center gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-200 font-medium truncate">
                {session.taskSummary?.title || repoLabel}
              </span>
              {session.isWorktree && (
                <span className="shrink-0 px-1 py-0.5 text-[8px] font-semibold uppercase tracking-wider rounded-sm bg-violet-500/10 border border-violet-500/20 text-violet-400">
                  wt
                </span>
              )}
            </div>
            <span className="block text-[10px] text-zinc-600 truncate font-(family-name:--font-geist-mono)">
              {repoLabel}
              {session.isWorktree && session.branch ? ` · ${session.branch}` : ""}
            </span>
          </div>
        </div>

        {editorAvailable && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              fetch("/api/actions/open", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "editor", path: session.workingDirectory, pid: session.pid }),
              }).catch((err) => console.error("Open editor failed:", err));
            }}
            className="has-tooltip shrink-0 flex items-center justify-center w-7 h-7 rounded-md bg-white/4 hover:bg-white/10 border border-white/7 hover:border-white/15 text-zinc-500 hover:text-zinc-200 transition-all"
            data-tip="Editor"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
              />
            </svg>
          </button>
        )}

        {/* Teammates + PRs, expandable beneath the row */}
        {(session.teammates.length > 0 || session.prs.length > 0) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="shrink-0 flex items-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <svg
              className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            {[
              session.teammates.length > 0 ? `${session.teammates.length} teammates` : null,
              session.prs.length > 0 ? `${session.prs.length} PRs` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </button>
        )}

        {/* Pending tool context + Approve/Reject for waiting sessions */}
        {isWaiting && session.hasPendingToolUse && onApproveReject && (
          <div className="shrink-0 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {session.preview.lastTools.length > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/6 border border-blue-500/12 max-w-[320px]">
                <span className="shrink-0 px-1.5 py-0.5 rounded-sm bg-violet-500/15 border border-violet-500/20 text-violet-300 font-mono text-[10px] font-medium">
                  {session.preview.lastTools[0].name}
                </span>
                {session.preview.lastTools[0].input && (
                  <span className="text-[10px] text-zinc-400 font-mono truncate">
                    {session.preview.lastTools[0].input}
                  </span>
                )}
              </div>
            )}
            <button
              onClick={() => onApproveReject("approve")}
              className="flex items-center justify-center w-6 h-6 rounded-md bg-emerald-600/80 hover:bg-emerald-500 text-white transition-colors"
              title="Approve"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </button>
            <button
              onClick={() => onApproveReject("reject")}
              className="flex items-center justify-center w-6 h-6 rounded-md bg-white/4 hover:bg-red-500/15 border border-white/7 hover:border-red-500/25 text-zinc-500 hover:text-red-400 transition-colors"
              title="Reject"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="pl-10 pr-3 pt-1.5">
          {session.taskSummary?.description && (
            <p className="text-[11px] text-zinc-500 mb-2 leading-relaxed line-clamp-3">
              {session.taskSummary.description}
            </p>
          )}
          <SessionDetails session={session} prStatuses={prStatuses} />
        </div>
      )}
    </div>
  );
}
