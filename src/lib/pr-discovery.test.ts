import { describe, expect, it } from "vitest";
import { extractOwnedPrUrls } from "./pr-discovery";

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
