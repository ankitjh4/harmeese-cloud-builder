import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const dataDir = join(repoRoot, ".harmeese");
const logFile = join(dataDir, "logs.json");

type LogMap = Record<string, string[]>;

async function readLogs(): Promise<LogMap> {
  try {
    return JSON.parse(await readFile(logFile, "utf8")) as LogMap;
  } catch {
    return {};
  }
}

async function writeLogs(logs: LogMap): Promise<void> {
  await mkdir(dirname(logFile), { recursive: true });
  await writeFile(logFile, JSON.stringify(logs, null, 2));
}

export async function addLog(jobId: string, message: string): Promise<void> {
  const logs = await readLogs();
  const line = `${new Date().toISOString()} ${message}`;
  logs[jobId] = [...(logs[jobId] ?? []), line].slice(-200);
  await writeLogs(logs);
  console.log(`[${jobId}] ${message}`);
}

export async function getLogs(jobId: string): Promise<string[]> {
  const logs = await readLogs();
  return logs[jobId] ?? [];
}
