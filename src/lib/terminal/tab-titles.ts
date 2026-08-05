import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const TITLE_TTL_MS = 5000;
const OSASCRIPT_TIMEOUT_MS = 5000;

// Only queries terminals that are already running — `tell application "X"` would
// launch X otherwise. iTerm2's session.autoName is the OSC-set title without the
// job-name suffix iTerm appends to `name`.
// `sep` is bound outside the tell blocks: inside them, AppleScript's `tab`
// constant resolves to iTerm2's `tab` class and emits the literal word "tab".
const SCRIPT = `set out to ""
set sep to (ASCII character 9)
tell application "System Events" to set runningApps to name of every process
if runningApps contains "iTerm2" then
  tell application "iTerm2"
    repeat with w in windows
      repeat with t in tabs of w
        repeat with s in sessions of t
          try
            set out to out & (tty of s) & sep & (variable of s named "session.autoName") & linefeed
          end try
        end repeat
      end repeat
    end repeat
  end tell
end if
if runningApps contains "Terminal" then
  tell application "Terminal"
    repeat with w in windows
      repeat with t in tabs of w
        try
          set out to out & (tty of t) & sep & (custom title of t) & linefeed
        end try
      end repeat
    end repeat
  end tell
end if
return out`;

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

/** TTY path → terminal tab title, as shown in the terminal's own tab bar. */
export async function getTabTitles(): Promise<Map<string, string>> {
  if (Date.now() - cachedAt < TITLE_TTL_MS) return cache;
  try {
    const { stdout } = await execFileAsync("osascript", ["-e", SCRIPT], { timeout: OSASCRIPT_TIMEOUT_MS });
    cache = parseTabTitles(stdout);
  } catch {
    cache = new Map();
  }
  cachedAt = Date.now();
  return cache;
}
