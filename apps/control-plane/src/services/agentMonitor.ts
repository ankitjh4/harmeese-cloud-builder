import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { AgentEvent, AgentEventType, JobRecord } from "@harmeese/shared/types.js";
import { getLogs } from "./logs.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const dataDir = join(repoRoot, ".harmeese");
const eventsFile = join(dataDir, "agent-events.json");

async function readEvents(): Promise<AgentEvent[]> {
  try {
    return JSON.parse(await readFile(eventsFile, "utf8")) as AgentEvent[];
  } catch {
    return [];
  }
}

async function writeEvents(events: AgentEvent[]): Promise<void> {
  await mkdir(dirname(eventsFile), { recursive: true });
  await writeFile(eventsFile, JSON.stringify(events.slice(-500), null, 2));
}

export async function recordAgentEvent(
  jobId: string,
  type: AgentEventType,
  message: string,
  metadata?: AgentEvent["metadata"]
): Promise<AgentEvent> {
  const event: AgentEvent = {
    id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    jobId,
    type,
    message,
    metadata,
    createdAt: new Date().toISOString()
  };
  const events = await readEvents();
  events.push(event);
  await writeEvents(events);
  return event;
}

async function listAgentRuns(job: JobRecord): Promise<string[]> {
  try {
    const runsDir = join(repoRoot, ".harmeese", "projects", job.id, job.projectName, "agent_runs");
    return (await readdir(runsDir))
      .filter((name) => name.endsWith(".md"))
      .sort()
      .reverse()
      .slice(0, 10);
  } catch {
    return [];
  }
}

export async function getJobMonitor(job: JobRecord): Promise<{
  jobId: string;
  projectName: string;
  status: string;
  backend: string;
  model: string;
  promptPack: string;
  websiteUrl?: string;
  instanceId?: string;
  recentLogs: string[];
  recentEvents: AgentEvent[];
  agentRuns: string[];
  metrics: {
    events: number;
    openrouterCalls: number;
    queuedRuns: number;
  };
}> {
  const events = (await readEvents()).filter((event) => event.jobId === job.id);
  const runs = await listAgentRuns(job);
  return {
    jobId: job.id,
    projectName: job.projectName,
    status: job.status,
    backend: job.agentBackend ?? "openrouter",
    model: job.openrouterModel ?? "default",
    promptPack: job.promptPack ?? "harmeese-webmaster",
    websiteUrl: job.websiteUrl,
    instanceId: job.instanceId,
    recentLogs: (await getLogs(job.id)).slice(-12),
    recentEvents: events.slice(-25).reverse(),
    agentRuns: runs,
    metrics: {
      events: events.length,
      openrouterCalls: events.filter((event) => event.type === "openrouter").length,
      queuedRuns: runs.length
    }
  };
}
