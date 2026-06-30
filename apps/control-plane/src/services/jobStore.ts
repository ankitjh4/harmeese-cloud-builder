import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { JobRecord, JobStatus, LaunchJobInput } from "@harmeese/shared/types.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const dataDir = join(repoRoot, ".harmeese");
const jobsFile = join(dataDir, "jobs.json");

async function readAll(): Promise<JobRecord[]> {
  try {
    return JSON.parse(await readFile(jobsFile, "utf8")) as JobRecord[];
  } catch {
    return [];
  }
}

async function writeAll(jobs: JobRecord[]): Promise<void> {
  await mkdir(dirname(jobsFile), { recursive: true });
  await writeFile(jobsFile, JSON.stringify(jobs, null, 2));
}

export async function createJob(input: LaunchJobInput, mode: "mock" | "real"): Promise<JobRecord> {
  const now = new Date().toISOString();
  const job: JobRecord = {
    ...input,
    id: `job-${Date.now().toString(36)}`,
    status: "queued",
    mode,
    createdAt: now,
    updatedAt: now,
    agentStatus: "queued"
  };
  const jobs = await readAll();
  jobs.unshift(job);
  await writeAll(jobs);
  return job;
}

export async function listJobs(): Promise<JobRecord[]> {
  return readAll();
}

export async function getJob(id: string): Promise<JobRecord | undefined> {
  return (await readAll()).find((job) => job.id === id);
}

export async function updateJob(id: string, patch: Partial<JobRecord> & { status?: JobStatus }): Promise<JobRecord> {
  const jobs = await readAll();
  const index = jobs.findIndex((job) => job.id === id);
  if (index === -1) throw new Error(`Unknown job ${id}`);
  jobs[index] = { ...jobs[index], ...patch, updatedAt: new Date().toISOString() };
  await writeAll(jobs);
  return jobs[index];
}

export async function findLatestJobForChat(chatId: string): Promise<JobRecord | undefined> {
  return (await readAll()).find((job) => job.telegramChatId === chatId && job.status === "ready");
}
