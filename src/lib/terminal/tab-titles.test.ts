import { describe, expect, it } from "vitest";
import { buildTitleScript, cleanTabTitle, parseTabTitles } from "./tab-titles";

describe("buildTitleScript", () => {
  it("asks nothing when no title-capable terminal is running", () => {
    expect(buildTitleScript(new Set())).toBeNull();
    expect(buildTitleScript(new Set(["ghostty", "kitty", "Warp"]))).toBeNull();
  });

  it("only addresses the terminals that are up", () => {
    const iterm = buildTitleScript(new Set(["iTerm2"]));
    expect(iterm).toContain('tell application "iTerm2"');
    expect(iterm).not.toContain('tell application "Terminal"');

    const both = buildTitleScript(new Set(["iTerm2", "Terminal", "ghostty"]));
    expect(both).toContain('tell application "iTerm2"');
    expect(both).toContain('tell application "Terminal"');
  });
});

describe("cleanTabTitle", () => {
  it("strips the Claude Code status glyph", () => {
    expect(cleanTabTitle("✳ Ignore the defect 2")).toBe("Ignore the defect 2");
    expect(cleanTabTitle("⠂ Build multi-session orchestrator dashboard")).toBe(
      "Build multi-session orchestrator dashboard",
    );
  });

  it("keeps slash-command titles intact", () => {
    expect(cleanTabTitle("/pr-review 233")).toBe("/pr-review 233");
  });

  it("leaves plain titles alone", () => {
    expect(cleanTabTitle("claude agents")).toBe("claude agents");
  });
});

describe("parseTabTitles", () => {
  it("maps tty to title and skips malformed lines", () => {
    const titles = parseTabTitles(
      ["/dev/ttys004\t✳ Fix the parser", "garbage without a tab", "/dev/ttys008\t", "\tno tty"].join("\n"),
    );
    expect(titles.get("/dev/ttys004")).toBe("Fix the parser");
    expect(titles.size).toBe(1);
  });
});
