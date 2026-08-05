import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const TITLE_TTL_MS = 5000;
const OSASCRIPT_TIMEOUT_MS = 5000;

/** Terminals whose tab titles are reachable per-tty, by their `ps` comm basename. */
export const TITLE_CAPABLE_APPS = ["iTerm2", "Terminal"] as const;

// Asks only for terminals that are actually running: `tell application "X"` would
// launch X otherwise, and skipping the script entirely avoids provoking an
// Automation prompt on machines that use neither.
// `sep` is bound outside the tell blocks — inside them AppleScript's `tab`
// constant resolves to iTerm2's `tab` class and emits the literal word "tab".
// iTerm2's session.autoName is the OSC-set title without the job-name suffix.
export function buildTitleScript(runningApps: Set<string>): string | null {
  const blocks: string[] = [];

  if (runningApps.has("iTerm2")) {
    blocks.push(`tell application "iTerm2"
  repeat with w in windows
    repeat with t in tabs of w
      repeat with s in sessions of t
        try
          set out to out & (tty of s) & sep & (variable of s named "session.autoName") & linefeed
        end try
      end repeat
    end repeat
  end repeat
end tell`);
  }

  if (runningApps.has("Terminal")) {
    blocks.push(`tell application "Terminal"
  repeat with w in windows
    repeat with t in tabs of w
      try
        set out to out & (tty of t) & sep & (custom title of t) & linefeed
      end try
    end repeat
  end repeat
end tell`);
  }

  if (blocks.length === 0) return null;
  return `set out to ""\nset sep to (ASCII character 9)\n${blocks.join("\n")}\nreturn out`;
}

let cache = new Map<string, string>();
let cachedAt = 0;

export function cleanTabTitle(raw: string): string {
  // Strips Claude Code's leading spinner/status glyph ("✳ ", "⠂ ") without
  // touching titles that legitimately start with a slash ("/pr-review …").
  return raw.replace(/^[^\p{L}\p{N}/]+/u, "").trim();
}

export function parseTabTitles(stdout: string): Map<string, string> {
  const titles = new Map<string, string>();
  for (const line of stdout.split("\n")) {
    const tab = line.indexOf("\t");
    if (tab === -1) continue;
    const tty = line.slice(0, tab).trim();
    const title = cleanTabTitle(line.slice(tab + 1));
    if (tty.startsWith("/dev/") && title) titles.set(tty, title);
  }
  return titles;
}

/**
 * TTY path → terminal tab title, as shown in the terminal's own tab bar.
 * Empty for terminals with no per-tty title API; callers fall back to the repo.
 */
export async function getTabTitles(runningApps: Set<string>): Promise<Map<string, string>> {
  if (Date.now() - cachedAt < TITLE_TTL_MS) return cache;

  const script = buildTitleScript(runningApps);
  if (!script) {
    cache = new Map();
    cachedAt = Date.now();
    return cache;
  }

  try {
    const { stdout } = await execFileAsync("osascript", ["-e", script], { timeout: OSASCRIPT_TIMEOUT_MS });
    cache = parseTabTitles(stdout);
  } catch {
    cache = new Map();
  }
  cachedAt = Date.now();
  return cache;
}
