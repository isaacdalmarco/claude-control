import { PrStatus } from "./types";

export type ChipTone = "green" | "purple" | "red" | "amber" | "zinc";

export interface PrChip {
  label: string;
  tone: ChipTone;
}

/**
 * One chip for a session's whole set of PRs: anything still open outranks the
 * rest, then the first PR that wasn't abandoned. Closed only speaks for the
 * session when it is the session's only PR.
 */
export function aggregatePrChip(prs: (PrStatus | null | undefined)[]): PrChip | null {
  const known = prs.filter((pr): pr is PrStatus => !!pr);
  if (known.length === 0) return null;
  if (known.some((pr) => pr.state === "OPEN")) return { label: "Open", tone: "green" };

  const leading = known.find((pr) => pr.state !== "CLOSED");
  if (leading) return prStateChip(leading);

  return known.length === 1 ? prStateChip(known[0]) : null;
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
