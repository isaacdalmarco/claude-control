// Linear issue URLs are workspace-scoped and the slug isn't derivable from the id.
const LINEAR_WORKSPACE = "revin";

const TICKET_RE = /\b(ENG|FDE)-(\d+)\b/i;

/** First Linear issue id in the text, normalised to upper case. */
export function extractTicketId(...texts: (string | null | undefined)[]): string | null {
  for (const text of texts) {
    const match = text?.match(TICKET_RE);
    if (match) return `${match[1].toUpperCase()}-${match[2]}`;
  }
  return null;
}

export function linearUrl(ticketId: string): string {
  return `https://linear.app/${LINEAR_WORKSPACE}/issue/${ticketId}`;
}
