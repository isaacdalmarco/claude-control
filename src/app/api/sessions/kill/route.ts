import { NextResponse } from "next/server";
import { isClaudeAgentProcess, isClaudeProcess } from "@/lib/process-utils";

async function terminate(pid: number): Promise<void> {
  try {
    process.kill(pid, "SIGTERM");
    await new Promise((r) => setTimeout(r, 1000));
    try {
      process.kill(pid, 0);
      process.kill(pid, "SIGKILL");
    } catch {
      // Already dead
    }
  } catch {
    // Process doesn't exist or already dead — that's fine
  }
}

export async function POST(request: Request) {
  try {
    const { pid, teammatePids } = (await request.json()) as { pid: number; teammatePids?: number[] };

    if (!pid || typeof pid !== "number") {
      return NextResponse.json({ error: "Missing or invalid pid" }, { status: 400 });
    }

    if (!(await isClaudeProcess(pid))) {
      return NextResponse.json({ error: "PID is not a claude process" }, { status: 403 });
    }

    // Teammates first — killing the lead would otherwise reparent them to launchd.
    const candidates = (teammatePids ?? []).filter((p) => typeof p === "number" && p > 0);
    const teammates = (
      await Promise.all(candidates.map(async (p) => ((await isClaudeAgentProcess(p)) ? p : null)))
    ).filter((p): p is number => p !== null);

    await Promise.all(teammates.map(terminate));
    await terminate(pid);

    return NextResponse.json({ ok: true, killedTeammates: teammates.length });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
