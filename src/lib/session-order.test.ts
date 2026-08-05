import { describe, expect, it } from "vitest";
import { applyOrder, reorder } from "./session-order";

const ids = (sessions: { id: string }[]) => sessions.map((s) => s.id);
const sessions = [{ id: "a" }, { id: "b" }, { id: "c" }];

describe("applyOrder", () => {
  it("leaves sessions alone when nothing has been reordered", () => {
    expect(applyOrder(sessions, [])).toEqual(sessions);
  });

  it("sorts by the saved order", () => {
    expect(ids(applyOrder(sessions, ["c", "a", "b"]))).toEqual(["c", "a", "b"]);
  });

  it("puts sessions the order has never seen at the end, in their original order", () => {
    expect(ids(applyOrder([{ id: "new" }, ...sessions], ["c", "a"]))).toEqual(["c", "a", "new", "b"]);
  });

  it("ignores ids for sessions that have gone away", () => {
    expect(ids(applyOrder(sessions, ["dead", "c", "b", "a"]))).toEqual(["c", "b", "a"]);
  });
});

describe("reorder", () => {
  it("moves the dragged id in front of the target", () => {
    expect(reorder(["a", "b", "c"], "c", "a")).toEqual(["c", "a", "b"]);
    expect(reorder(["a", "b", "c"], "a", "c")).toEqual(["b", "a", "c"]);
  });

  it("appends when the target is unknown", () => {
    expect(reorder(["a", "b"], "a", "gone")).toEqual(["b", "a"]);
  });
});
