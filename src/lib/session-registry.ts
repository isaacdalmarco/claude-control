import { readdir, readFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";

const SESSIONS_DIR = join(homedir(), ".claude", "sessions");

/** What Claude Code itself records for a live session — the same source `claude agents` reads. */
export interface RegistrySession {
  pid: number;
  sessionId: string;
  cwd: string;
  name: string | null;
  /** "interactive" for a terminal session, "bg" for a dispatched background one. */
  kind: string | null;
  /** Claude Code's own view: "busy" while a turn is in flight, "idle" at the prompt. */
  status: string | null;
}

export function parseRegistryEntry(raw: string): RegistrySession | null {
  try {
    const entry = JSON.parse(raw);
    if (typeof entry?.pid !== "number" || typeof entry?.sessionId !== "string" || typeof entry?.cwd !== "string") {
      return null;
    }
    return {
      pid: entry.pid,
      sessionId: entry.sessionId,
      cwd: entry.cwd,
      name: typeof entry.name === "string" ? entry.name : null,
      kind: typeof entry.kind === "string" ? entry.kind : null,
      status: typeof entry.status === "string" ? entry.status : null,
    };
  } catch {
    return null;
  }
}

/**
 * Live sessions by pid, straight from Claude Code's registry.
 *
 * Process-table discovery misses two kinds: background sessions, whose `comm` is
 * "claude bg-spare" rather than "claude", and any session whose cwd lsof cannot
 * resolve. The registry knows both, and carries the real session id — which is
 * also what makes a rename survive.
 */
export async function readSessionRegistry(isAlive: (pid: number) => boolean): Promise<Map<number, RegistrySession>> {
  const sessions = new Map<number, RegistrySession>();

  let files: string[];
  try {
    files = await readdir(SESSIONS_DIR);
  } catch {
    return sessions;
  }

  await Promise.all(
    files
      .filter((file) => file.endsWith(".json"))
      .map(async (file) => {
        try {
          const entry = parseRegistryEntry(await readFile(join(SESSIONS_DIR, file), "utf-8"));
          if (entry && isAlive(entry.pid)) sessions.set(entry.pid, entry);
        } catch {
          /* skip unreadable or half-written entries */
        }
      }),
  );

  return sessions;
}
