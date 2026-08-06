import { describe, expect, it } from "vitest";
import { extractOwnedPrUrls, shouldUseBranchPr } from "./pr-discovery";

describe("shouldUseBranchPr", () => {
  const base = { branch: "eng-1", ownsTranscriptPrs: false, isWorktree: false, sharesWorkingDirectory: false };

  it("uses the branch PR when the session has the repo to itself", () => {
    expect(shouldUseBranchPr(base)).toBe(true);
  });

  it("uses it in a worktree even alongside other sessions", () => {
    expect(shouldUseBranchPr({ ...base, isWorktree: true, sharesWorkingDirectory: true })).toBe(true);
  });

  it("refuses when sessions share a checkout — the PR describes none of them", () => {
    expect(shouldUseBranchPr({ ...base, sharesWorkingDirectory: true })).toBe(false);
  });

  it("prefers the PRs the transcript owns", () => {
    expect(shouldUseBranchPr({ ...base, ownsTranscriptPrs: true })).toBe(false);
  });

  it("ignores trunk branches and missing ones", () => {
    expect(shouldUseBranchPr({ ...base, branch: "main" })).toBe(false);
    expect(shouldUseBranchPr({ ...base, branch: "master" })).toBe(false);
    expect(shouldUseBranchPr({ ...base, branch: null })).toBe(false);
  });
});

describe("extractOwnedPrUrls", () => {
  it("picks up PRs the session created", () => {
    const urls: string[] = [];
    extractOwnedPrUrls(
      `{"tool":"Bash","command":"gh pr create --fill","result":"https://github.com/Authentic-Wallet/api/pull/42"}`,
      urls,
    );
    expect(urls).toEqual(["https://github.com/Authentic-Wallet/api/pull/42"]);
  });

  it("ignores PRs merely mentioned in search output", () => {
    const urls: string[] = [];
    extractOwnedPrUrls(`{"result":"gh search prs → https://github.com/Authentic-Wallet/api/pull/7"}`, urls);
    expect(urls).toEqual([]);
  });

  it("collects PRs across repos and several PRs in one repo", () => {
    const urls: string[] = [];
    extractOwnedPrUrls(
      [
        `{"command":"gh pr create","result":"https://github.com/Authentic-Wallet/api/pull/1"}`,
        `{"command":"gh pr create","result":"https://github.com/Authentic-Wallet/api/pull/2"}`,
        `{"text":"/pr-review https://github.com/Authentic-Wallet/web/pull/9"}`,
      ].join("\n"),
      urls,
    );
    expect(urls).toEqual([
      "https://github.com/Authentic-Wallet/api/pull/1",
      "https://github.com/Authentic-Wallet/api/pull/2",
      "https://github.com/Authentic-Wallet/web/pull/9",
    ]);
  });

  it("dedupes repeated mentions", () => {
    const urls: string[] = [];
    const line = `{"command":"gh pr create","result":"https://github.com/Authentic-Wallet/api/pull/1"}`;
    extractOwnedPrUrls(`${line}\n${line}`, urls);
    expect(urls).toHaveLength(1);
  });

  it("caps how many PRs one session accumulates", () => {
    const urls: string[] = [];
    const lines = Array.from(
      { length: 20 },
      (_, i) => `{"command":"gh pr create","result":"https://github.com/Authentic-Wallet/api/pull/${i}"}`,
    );
    extractOwnedPrUrls(lines.join("\n"), urls);
    expect(urls).toHaveLength(8);
  });
});
