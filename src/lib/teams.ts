import { execFile } from "child_process";
import { readdir, readFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
import { promisify } from "util";
import { PROCESS_TIMEOUT_MS } from "./constants";
import { Teammate } from "./types";

const execFileAsync = promisify(execFile);

const TEAMS_DIR = join(homedir(), ".claude", "teams");

interface TeamMemberConfig {
  agentId?: string;
  name?: string;
  agentType?: string;
  model?: string;
  joinedAt?: number;
  tmuxPaneId?: string;
}

interface TeamConfig {
  leadSessionId?: string;
  members?: TeamMemberConfig[];
}

/** agentId → pid, for the teammates still running. */
export function parseAgentPids(psOutput: string): Map<string, number> {
  const pids = new Map<string, number>();
  for (const line of psOutput.split("\n")) {
    const agent = line.match(/--agent-id\s+(\S+)/);
    const pid = line.trim().match(/^(\d+)\s/);
    if (agent && pid) pids.set(agent[1], parseInt(pid[1], 10));
  }
  return pids;
}

async function runningAgentPids(): Promise<Map<string, number>> {
  try {
    const { stdout } = await execFileAsync("ps", ["-eo", "pid=,command="], { timeout: PROCESS_TIMEOUT_MS });
    return parseAgentPids(stdout);
  } catch {
    return new Map();
  }
}

export function toTeammates(config: TeamConfig, agentPids: Map<string, number>): Teammate[] {
  return (config.members ?? [])
    .filter((member) => member.agentType !== "team-lead" && member.agentId)
    .map((member) => ({
      agentId: member.agentId!,
      name: member.name ?? member.agentId!,
      agentType: member.agentType ?? "agent",
      model: member.model ?? null,
      joinedAt: member.joinedAt ?? null,
      pid: agentPids.get(member.agentId!) ?? null,
    }));
}

/** Lead session id → the teammates it spawned. */
export async function readTeams(): Promise<Map<string, Teammate[]>> {
  const teams = new Map<string, Teammate[]>();

  let dirs: string[];
  try {
    dirs = await readdir(TEAMS_DIR);
  } catch {
    return teams;
  }

  const agentPids = await runningAgentPids();

  await Promise.all(
    dirs.map(async (dir) => {
      try {
        const config: TeamConfig = JSON.parse(await readFile(join(TEAMS_DIR, dir, "config.json"), "utf-8"));
        if (!config.leadSessionId) return;
        const teammates = toTeammates(config, agentPids);
        if (teammates.length > 0) teams.set(config.leadSessionId, teammates);
      } catch {
        /* skip malformed or half-written team configs */
      }
    }),
  );

  return teams;
}
