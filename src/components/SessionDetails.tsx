"use client";

import { ClaudeSession, PrStatus, Teammate } from "@/lib/types";
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

function PrRow({ url, pr }: { url: string; pr: PrStatus | null | undefined }) {
  return (
    <div
      onClick={(e) => openUrl(e, url)}
      className="group flex items-center gap-2 text-[11px] py-1 cursor-pointer"
      title={url}
    >
      <ChecksIcon pr={pr} />
      <span className="truncate text-zinc-300 group-hover:text-blue-300 font-(family-name:--font-geist-mono)">
        {prLabel(url)}
      </span>
      {pr?.checksDetail && (
        <span className="shrink-0 text-zinc-600 font-(family-name:--font-geist-mono) text-[10px]">
          {pr.checksDetail.passing}/{pr.checksDetail.total}
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
    <div className="mb-3 rounded-lg border border-white/6 bg-white/2 px-2.5 py-2 space-y-2">
      {session.teammates.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wide text-zinc-600 mb-0.5">
            Teammates ({session.teammates.length})
          </div>
          {session.teammates.map((teammate) => (
            <TeammateRow key={teammate.agentId} teammate={teammate} />
          ))}
        </div>
      )}

      {session.prs.length > 0 && (
        <div>
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
