import { describe, expect, it } from "vitest";
import { prStateChip } from "./pr-chip";
import { PrStatus } from "./types";

function pr(overrides: Partial<PrStatus>): PrStatus {
  return {
    url: "https://github.com/acme/api/pull/1",
    state: "OPEN",
    isDraft: false,
    checks: "passing",
    reviewDecision: null,
    mergeable: "MERGEABLE",
    mergeStateStatus: "CLEAN",
    unresolvedThreads: 0,
    commentCount: 0,
    additions: 0,
    deletions: 0,
    ...overrides,
  };
}

describe("prStateChip", () => {
  it("reports lifecycle before review state", () => {
    expect(prStateChip(pr({ state: "MERGED", reviewDecision: "APPROVED" })).label).toBe("Merged");
    expect(prStateChip(pr({ state: "CLOSED", reviewDecision: "CHANGES_REQUESTED" })).label).toBe("Closed");
    expect(prStateChip(pr({ isDraft: true, reviewDecision: "APPROVED" })).label).toBe("Draft");
  });

  it("reports where review stands on an open PR", () => {
    expect(prStateChip(pr({ reviewDecision: "CHANGES_REQUESTED" })).label).toBe("Changes requested");
    expect(prStateChip(pr({ reviewDecision: "APPROVED" })).label).toBe("Approved");
    expect(prStateChip(pr({ reviewDecision: "REVIEW_REQUIRED" })).label).toBe("Review required");
  });

  it("falls back to Open when no review is configured", () => {
    expect(prStateChip(pr({}))).toEqual({ label: "Open", tone: "green" });
  });
});
