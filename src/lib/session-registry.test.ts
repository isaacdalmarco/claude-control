import { describe, expect, it } from "vitest";
import { parseRegistryEntry } from "./session-registry";

const entry = JSON.stringify({
  pid: 85719,
  sessionId: "53160ce5-d898-441e-9b6d-78e4aa9afee5",
  cwd: "/Users/isaac/workspace/command_center",
  kind: "bg",
  entrypoint: "cli",
  name: "data structure review eng-1999",
  status: "shell",
});

describe("parseRegistryEntry", () => {
  it("reads the fields discovery needs", () => {
    expect(parseRegistryEntry(entry)).toEqual({
      pid: 85719,
      sessionId: "53160ce5-d898-441e-9b6d-78e4aa9afee5",
      cwd: "/Users/isaac/workspace/command_center",
      name: "data structure review eng-1999",
      kind: "bg",
      status: "shell",
    });
  });

  it("rejects entries missing what identifies a session", () => {
    expect(parseRegistryEntry("{}")).toBeNull();
    expect(parseRegistryEntry(JSON.stringify({ pid: 1, cwd: "/tmp" }))).toBeNull();
    expect(parseRegistryEntry(JSON.stringify({ sessionId: "x", cwd: "/tmp" }))).toBeNull();
  });

  it("survives a half-written file", () => {
    expect(parseRegistryEntry('{"pid":8571')).toBeNull();
  });

  it("tolerates a missing name, kind or status", () => {
    const partial = parseRegistryEntry(JSON.stringify({ pid: 1, sessionId: "x", cwd: "/tmp" }));
    expect(partial).toEqual({ pid: 1, sessionId: "x", cwd: "/tmp", name: null, kind: null, status: null });
  });
});
