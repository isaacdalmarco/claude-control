import { describe, expect, it } from "vitest";
import { aggregatePrChip, approvalMessage, prStateChip } from "./pr-chip";
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
    headRefName: null,
    title: null,
    ...overrides,
  };
}

describe("aggregatePrChip", () => {
  it("is Merged when every PR is", () => {
    expect(aggregatePrChip([pr({ state: "MERGED" }), pr({ state: "MERGED" })])?.label).toBe("Merged");
  });

  it("is Open when anything is still open", () => {
    expect(aggregatePrChip([pr({ state: "MERGED" }), pr({ state: "OPEN" })])?.label).toBe("Open");
  });

  it("skips closed PRs when picking the one to speak for the session", () => {
    expect(aggregatePrChip([pr({ state: "CLOSED" }), pr({ state: "MERGED" })])?.label).toBe("Merged");
  });

  it("shows Closed only when the session has a single, closed PR", () => {
    expect(aggregatePrChip([pr({ state: "CLOSED" })])?.label).toBe("Closed");
    expect(aggregatePrChip([pr({ state: "CLOSED" }), pr({ state: "CLOSED" })])).toBeNull();
  });

  it("ignores PRs whose status has not loaded, and yields nothing when none have", () => {
    expect(aggregatePrChip([null, pr({ state: "OPEN" })])?.label).toBe("Open");
    expect(aggregatePrChip([null, undefined])).toBeNull();
  });
});

describe("approvalMessage", () => {
  it("drops the scheme and joins the title with a dash", () => {
    expect(
      approvalMessage(
        "https://github.com/Authentic-Wallet/consolidated-dashboard/pull/752",
        "fix(chat): scope call-event placement to payload.call_id",
      ),
    ).toBe(
      "@eng github.com/Authentic-Wallet/consolidated-dashboard/pull/752 - fix(chat): scope call-event placement to payload.call_id",
    );
  });

  it("omits the dash when the title is unknown", () => {
    expect(approvalMessage("https://github.com/acme/api/pull/1", null)).toBe("@eng github.com/acme/api/pull/1");
  });
});

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
