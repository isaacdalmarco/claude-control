import { describe, expect, it } from "vitest";
import { parseAgentPids, toTeammates } from "./teams";

describe("parseAgentPids", () => {
  it("maps agent ids to pids", () => {
    const pids = parseAgentPids(
      [
        "67404 /Users/x/.local/share/claude/2.1.220 --agent-id eng-2145-backend@session-c784 --agent-name eng-2145-backend",
        "73019 claude",
      ].join("\n"),
    );
    expect(pids.get("eng-2145-backend@session-c784")).toBe(67404);
    expect(pids.size).toBe(1);
  });
});

describe("toTeammates", () => {
  const agentPids = new Map([["pr-review-2791@session-6cff", 67404]]);

  it("drops the team lead and marks live teammates", () => {
    const teammates = toTeammates(
      {
        leadSessionId: "6cff10ef-0000",
        members: [
          { agentId: "team-lead@session-6cff", name: "team-lead", agentType: "team-lead" },
          {
            agentId: "pr-review-2791@session-6cff",
            name: "pr-review-2791",
            agentType: "general-purpose",
            model: "claude-opus-5",
            joinedAt: 1785957912764,
          },
          { agentId: "scout@session-6cff", name: "scout", agentType: "general-purpose" },
        ],
      },
      agentPids,
    );

    expect(teammates.map((t) => t.name)).toEqual(["pr-review-2791", "scout"]);
    expect(teammates[0].pid).toBe(67404);
    expect(teammates[0].model).toBe("claude-opus-5");
    expect(teammates[1].pid).toBeNull();
  });

  it("tolerates a config with no members", () => {
    expect(toTeammates({ leadSessionId: "x" }, agentPids)).toEqual([]);
  });
});
