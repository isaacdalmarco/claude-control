import { PrStatus } from "./types";

export type ChipTone = "green" | "purple" | "red" | "amber" | "zinc";

export interface PrChip {
  label: string;
  tone: ChipTone;
}

/** The line you paste in #eng to ask for a review. */
export function approvalMessage(url: string, title: string | null | undefined): string {
  const bare = url.replace(/^https?:\/\//, "");
  return title ? `@eng ${bare} - ${title}` : `@eng ${bare}`;
}

/**
 * The status chip GitHub puts on a PR: lifecycle first, then where review stands.
 */
export function prStateChip(pr: PrStatus): PrChip {
  if (pr.state === "MERGED") return { label: "Merged", tone: "purple" };
  if (pr.state === "CLOSED") return { label: "Closed", tone: "red" };
  if (pr.isDraft) return { label: "Draft", tone: "zinc" };
  if (pr.reviewDecision === "CHANGES_REQUESTED") return { label: "Changes requested", tone: "red" };
  if (pr.reviewDecision === "APPROVED") return { label: "Approved", tone: "green" };
  if (pr.reviewDecision === "REVIEW_REQUIRED") return { label: "Review required", tone: "amber" };
  return { label: "Open", tone: "green" };
}
