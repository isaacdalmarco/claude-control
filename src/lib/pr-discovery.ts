import { createReadStream } from "fs";
import { stat } from "fs/promises";

const PR_URL_RE = /https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+/g;

// A transcript quotes far more PRs than a session owns (`gh pr list` dumps, docs,
// pasted links). A session owns the ones it created or was told to shepherd.
const OWNERSHIP_RE = /gh pr create|pr-review|gh pr merge/;

// Docs and skill files carry example URLs next to the same command names.
const PLACEHOLDER_RE = /github\.com\/(owner|org|OWNER|ORG|your-org|example|acme|repo)\//;

const MAX_PRS_PER_SESSION = 8;

type ScanState = { offset: number; urls: string[] };

const scans = new Map<string, ScanState>();

export function extractOwnedPrUrls(chunk: string, into: string[]): void {
  for (const line of chunk.split("\n")) {
    if (!OWNERSHIP_RE.test(line)) continue;
    for (const url of line.match(PR_URL_RE) ?? []) {
      if (into.length >= MAX_PRS_PER_SESSION) return;
      if (PLACEHOLDER_RE.test(url)) continue;
      if (!into.includes(url)) into.push(url);
    }
  }
}

/**
 * PR URLs this session created or was asked to shepherd. Scans only the bytes
 * appended since the last poll, so the full-file cost is paid once per session.
 */
export async function getOwnedPrUrls(jsonlPath: string): Promise<string[]> {
  let size: number;
  try {
    size = (await stat(jsonlPath)).size;
  } catch {
    return scans.get(jsonlPath)?.urls ?? [];
  }

  const previous = scans.get(jsonlPath);
  const state: ScanState = previous && size >= previous.offset ? previous : { offset: 0, urls: [] };
  scans.set(jsonlPath, state);
  if (size === state.offset) return state.urls;

  let carry = "";
  await new Promise<void>((resolve) => {
    const stream = createReadStream(jsonlPath, { start: state.offset, end: size - 1, encoding: "utf8" });
    stream.on("data", (data) => {
      const text = carry + data;
      const lastBreak = text.lastIndexOf("\n");
      if (lastBreak === -1) {
        carry = text;
        return;
      }
      extractOwnedPrUrls(text.slice(0, lastBreak), state.urls);
      carry = text.slice(lastBreak + 1);
    });
    stream.on("error", () => resolve());
    stream.on("close", () => resolve());
  });

  // Leave the trailing partial line unconsumed so it is re-read once complete.
  state.offset = size - Buffer.byteLength(carry);
  return state.urls;
}

export function resetPrScanCache(): void {
  scans.clear();
}

/**
 * Whether the checked-out branch's PR belongs to this session.
 *
 * It does when the session owns the checkout — its own worktree, or a repo no
 * other session is sitting in. It does not when several sessions share a
 * directory: they all resolve to one PR that describes none of them.
 */
export function shouldUseBranchPr(options: {
  branch: string | null;
  ownsTranscriptPrs: boolean;
  isWorktree: boolean;
  sharesWorkingDirectory: boolean;
}): boolean {
  const { branch, ownsTranscriptPrs, isWorktree, sharesWorkingDirectory } = options;
  if (ownsTranscriptPrs) return false;
  if (!branch || branch === "main" || branch === "master") return false;
  return isWorktree || !sharesWorkingDirectory;
}
