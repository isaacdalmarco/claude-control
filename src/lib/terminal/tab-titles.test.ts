import { describe, expect, it } from "vitest";
import { cleanTabTitle, parseTabTitles } from "./tab-titles";

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
