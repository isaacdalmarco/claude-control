import { describe, expect, it } from "vitest";
import { extractTicketId, linearUrl } from "./linear";

describe("extractTicketId", () => {
  it("finds ENG and FDE ids regardless of case", () => {
    expect(extractTicketId("Fix the parser (ENG-1734)")).toBe("ENG-1734");
    expect(extractTicketId("fde-42 follow-up")).toBe("FDE-42");
  });

  it("finds ids inside branch names", () => {
    expect(extractTicketId("eng-2145-backend")).toBe("ENG-2145");
    expect(extractTicketId("isaac/ENG-1868-retry")).toBe("ENG-1868");
  });

  it("falls through the arguments in order", () => {
    expect(extractTicketId(null, "no ticket here", "eng-7-x")).toBe("ENG-7");
    expect(extractTicketId(undefined, "nothing")).toBeNull();
  });

  it("ignores lookalikes", () => {
    expect(extractTicketId("STRENGTHENING-12")).toBeNull();
    expect(extractTicketId("ENG-")).toBeNull();
  });

  it("builds a workspace URL", () => {
    expect(linearUrl("ENG-1734")).toBe("https://linear.app/revin/issue/ENG-1734");
  });
});
