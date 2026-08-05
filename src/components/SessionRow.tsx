"use client";

import { useState } from "react";
import { extractTicketId } from "@/lib/linear";
import { aggregatePrChip } from "@/lib/pr-chip";
import { ClaudeSession, PrStatus, SessionStatus, statusLabels } from "@/lib/types";
import { LinearChip } from "./LinearChip";
import { SessionDetails } from "./SessionDetails";
import { StateChip } from "./StateChip";

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
  editing,
  onStartEdit,
  onSaveMeta,
  onCancelEdit,
  onReorder,
}: {
  session: ClaudeSession;
  selected?: boolean;
  shortcutNumber?: number;
  prStatuses?: Record<string, PrStatus | null>;
  onSelect?: () => void;
  displayStatus: SessionStatus;
  isStale?: boolean;
  onApproveReject?: (action: "approve" | "reject") => void;
  editing?: boolean;
  onStartEdit?: () => void;
  onSaveMeta?: (updates: { title?: string | null; description?: string | null }) => void;
  onCancelEdit?: () => void;
  onReorder?: (draggedId: string, targetId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [prevSelected, setPrevSelected] = useState(selected);
  const [draft, setDraft] = useState("");
  const [killing, setKilling] = useState(false);
  const [dropTarget, setDropTarget] = useState(false);
  const [prevEditing, setPrevEditing] = useState(editing);

  // Seed the input from whatever the row currently shows when editing opens.
  if (editing !== prevEditing) {
    setPrevEditing(editing);
    if (editing) setDraft(session.taskSummary?.title ?? "");
  }

  // Selecting a row opens it, deselecting closes it; the chevron still wins after that.
  if (selected !== prevSelected) {
    setPrevSelected(selected);
    setExpanded(!!selected);
  }
  const colors = isStale ? { dot: "bg-zinc-500", text: "text-zinc-400" } : statusColors[displayStatus];
  const label = isStale ? "Stale" : statusLabels[displayStatus];
  const isWaiting = displayStatus === "waiting";

  const repoLabel =
    session.isWorktree && session.parentRepo
      ? session.workingDirectory.split("/").filter(Boolean).pop() || session.repoName
      : session.repoName || "Unknown";

  const ticketId =
    session.taskSummary?.ticketId ?? extractTicketId(session.taskSummary?.title, session.branch, repoLabel);

  const prChip = aggregatePrChip(session.prs.map((url) => prStatuses?.[url]));

  // What you last asked for says more about a row than the folder it runs in —
  // and the repo is already the group heading above it.
  const lastPrompt = session.preview.lastUserMessage?.replace(/\s+/g, " ").trim() || null;

  return (
    <div>
      <div
        onClick={onSelect}
        draggable={!!onReorder}
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", session.id);
          e.dataTransfer.effectAllowed = "move";
        }}
        onDragOver={(e) => {
          if (!onReorder) return;
          e.preventDefault();
          setDropTarget(true);
        }}
        onDragLeave={() => setDropTarget(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDropTarget(false);
          const draggedId = e.dataTransfer.getData("text/plain");
          if (draggedId && draggedId !== session.id) onReorder?.(draggedId, session.id);
        }}
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-100 ${
          selected
            ? "bg-blue-500/8 border border-blue-400/30 shadow-[0_0_20px_rgba(96,165,250,0.1)]"
            : "bg-white/2 border border-transparent hover:bg-white/4 hover:border-white/6"
        } ${dropTarget ? "border-blue-400/50 bg-blue-500/5" : ""} ${isStale && !selected ? "opacity-55 hover:opacity-100" : ""}`}
      >
        {onReorder && (
          <span
            className="has-tooltip shrink-0 text-zinc-800 group-hover:text-zinc-600 cursor-grab active:cursor-grabbing transition-colors"
            data-tip="Drag to reorder"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="6" r="1.6" />
              <circle cx="15" cy="6" r="1.6" />
              <circle cx="9" cy="12" r="1.6" />
              <circle cx="15" cy="12" r="1.6" />
              <circle cx="9" cy="18" r="1.6" />
              <circle cx="15" cy="18" r="1.6" />
            </svg>
          </span>
        )}

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
              {editing ? (
                <span className="flex items-center gap-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                  <input
                    autoFocus
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onSaveMeta?.({ title: draft.trim() || null });
                      }
                      if (e.key === "Escape") {
                        e.preventDefault();
                        onCancelEdit?.();
                      }
                    }}
                    className="min-w-0 w-64 px-2 py-0.5 rounded-md text-sm bg-white/6 border border-white/10 focus:border-blue-500/40 text-zinc-200 outline-hidden"
                  />
                  <button
                    onClick={() => onSaveMeta?.({ title: draft.trim() || null })}
                    className="has-tooltip shrink-0 text-emerald-400 hover:text-emerald-300"
                    data-tip="Apply (⏎)"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </button>
                </span>
              ) : (
                <>
                  <span className="text-sm text-zinc-200 font-medium truncate">
                    {session.taskSummary?.title || repoLabel}
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onStartEdit?.();
                    }}
                    className="has-tooltip shrink-0 text-zinc-700 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-all"
                    data-tip="Rename"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                      />
                    </svg>
                  </button>
                </>
              )}
              {ticketId && <LinearChip ticketId={ticketId} url={session.taskSummary?.ticketUrl} />}
              {prChip && <StateChip chip={prChip} />}
              {session.isWorktree && (
                <span className="shrink-0 px-1 py-0.5 text-[8px] font-semibold uppercase tracking-wider rounded-sm bg-violet-500/10 border border-violet-500/20 text-violet-400">
                  wt
                </span>
              )}
            </div>
            <span className="block text-[10px] text-zinc-600 truncate" title={lastPrompt ?? undefined}>
              {lastPrompt ?? (
                <span className="font-(family-name:--font-geist-mono)">
                  {repoLabel}
                  {session.isWorktree && session.branch ? ` · ${session.branch}` : ""}
                </span>
              )}
            </span>
          </div>
        </div>

        {(session.teammates.length > 0 || session.prs.length > 0) && (
          <span className="shrink-0 text-[10px] text-zinc-600">
            {[
              session.teammates.length > 0 ? `${session.teammates.length} teammates` : null,
              session.prs.length > 0 ? `${session.prs.length} PRs` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        )}

        {session.pid && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              fetch("/api/actions/open", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "focus", path: session.workingDirectory, pid: session.pid }),
              }).catch((err) => console.error("Focus terminal failed:", err));
            }}
            className="has-tooltip shrink-0 flex items-center justify-center w-7 h-7 rounded-md bg-white/4 hover:bg-white/10 border border-white/7 hover:border-white/15 text-zinc-500 hover:text-zinc-200 transition-all"
            data-tip="Terminal"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </button>
        )}

        {session.pid && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const label = session.taskSummary?.title || repoLabel;
              const alsoTeammates = session.teammates.length
                ? ` and ${session.teammates.length} teammate${session.teammates.length > 1 ? "s" : ""}`
                : "";
              if (!window.confirm(`Kill "${label}"${alsoTeammates}?\n\nUnsaved work in the session is lost.`)) return;
              setKilling(true);
              fetch("/api/sessions/kill", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  pid: session.pid,
                  teammatePids: session.teammates.map((t) => t.pid).filter(Boolean),
                }),
              })
                .catch((err) => console.error("Kill failed:", err))
                .finally(() => setTimeout(() => setKilling(false), 3000));
            }}
            disabled={killing}
            className="has-tooltip shrink-0 flex items-center justify-center w-7 h-7 rounded-md bg-white/4 hover:bg-red-500/15 border border-white/7 hover:border-red-500/25 text-zinc-500 hover:text-red-400 disabled:opacity-40 transition-all"
            data-tip={session.teammates.length ? "Kill session + teammates" : "Kill session"}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
            </svg>
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

        {/* Expand — last thing on the row, nothing to its right */}
        {(session.teammates.length > 0 || session.prs.length > 0) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors"
            data-tip="Details"
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
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
