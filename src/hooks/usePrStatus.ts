import useSWR from "swr";
import { ClaudeSession, PrStatus } from "@/lib/types";

const PR_POLL_MS = 30_000;

/** Every PR across all sessions, deduped, each paired with a cwd `gh` can run in. */
function prTargets(sessions: ClaudeSession[]): { prUrls: string[]; cwds: string[] } {
  const cwdByUrl = new Map<string, string>();
  for (const session of sessions) {
    for (const url of session.prs) {
      if (!cwdByUrl.has(url)) cwdByUrl.set(url, session.workingDirectory);
    }
  }
  return { prUrls: [...cwdByUrl.keys()], cwds: [...cwdByUrl.values()] };
}

async function fetchPrStatuses(sessions: ClaudeSession[]): Promise<Record<string, PrStatus | null>> {
  const targets = prTargets(sessions);
  if (targets.prUrls.length === 0) return {};

  const res = await fetch("/api/pr-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(targets),
  });

  if (!res.ok) return {};
  const data = await res.json();
  return data.statuses ?? {};
}

export function usePrStatus(sessions: ClaudeSession[]) {
  // Stable key from the set of PR URLs so SWR re-fetches when PRs change
  const prUrls = prTargets(sessions).prUrls.sort().join(",");

  const { data } = useSWR<Record<string, PrStatus | null>>(
    prUrls ? `pr-status:${prUrls}` : null,
    () => fetchPrStatuses(sessions),
    { refreshInterval: PR_POLL_MS, revalidateOnFocus: false },
  );

  return data ?? {};
}
