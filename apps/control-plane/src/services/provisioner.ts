import { cp, mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { MockJarvisLabsAdapter, RealJarvisLabsAdapter, type JarvisLabsAdapter } from "@harmeese/jarvislabs-adapter";
import { classifyCommand } from "@harmeese/shared/safety.js";
import type { AppEnv } from "@harmeese/shared/env.js";
import type { JobRecord } from "@harmeese/shared/types.js";
import { addLog } from "./logs.js";
import { updateJob } from "./jobStore.js";

const sleep = (ms: number) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

function adapterFor(env: AppEnv): JarvisLabsAdapter {
  return env.mode === "real"
    ? new RealJarvisLabsAdapter(env.allowRealProvisioning)
    : new MockJarvisLabsAdapter();
}

function projectPath(job: JobRecord): string {
  return resolve(repoRoot, ".harmeese", "projects", job.id, job.projectName);
}

async function materializeProject(job: JobRecord, env: AppEnv): Promise<string> {
  const target = projectPath(job);
  const template = resolve(repoRoot, "packages", "project-template", "base");
  await mkdir(target, { recursive: true });
  await cp(template, target, { recursive: true });
  await writeFile(join(target, ".env"), [
    `PROJECT_NAME=${job.projectName}`,
    `BOILERPLATE=${job.boilerplate}`,
    `ANTHROPIC_API_KEY=${job.anthropicApiKey ?? env.anthropicApiKey}`,
    `TELEGRAM_BOT_TOKEN=${job.telegramBotToken ?? env.telegramBotToken}`,
    `TELEGRAM_CHAT_ID=${job.telegramChatId ?? env.telegramChatId}`,
    `WEBSITE_PORT=${env.defaultWebsitePort}`,
    `CONTROL_PLANE_URL=${env.controlPlaneUrl}`
  ].join("\n"));
  return target;
}

export async function runProvisioning(job: JobRecord, env: AppEnv): Promise<void> {
  const adapter = adapterFor(env);
  try {
    if (env.mode === "real") {
      if (!env.allowRealProvisioning) throw new Error("Real mode requires ALLOW_REAL_PROVISIONING=true.");
      if (!job.jarvislabsApiKey && !env.jarvislabsApiKey) throw new Error("JarvisLabs API key is required for real mode.");
      if (!job.anthropicApiKey && !env.anthropicApiKey) throw new Error("Anthropic API key is required for real mode.");
    }

    await addLog(job.id, "Queued provisioning job.");
    await updateJob(job.id, { status: "provisioning", agentStatus: "provisioning" });
    await addLog(job.id, `${env.mode === "mock" ? "Mock" : "Real"} JarvisLabs provisioning started.`);
    await sleep(env.mode === "mock" ? 700 : 50);

    const instance = await adapter.createInstance({
      projectName: job.projectName,
      apiKey: job.jarvislabsApiKey ?? env.jarvislabsApiKey,
      websitePort: env.defaultWebsitePort
    });
    await updateJob(job.id, { instanceId: instance.instanceId });
    await addLog(job.id, `Instance allocated: ${instance.instanceId}`);

    await updateJob(job.id, { status: "installing", agentStatus: "installing project template" });
    await sleep(env.mode === "mock" ? 700 : 50);
    const target = await materializeProject(job, env);
    await addLog(job.id, `Project template installed at ${target}`);

    const bootstrap = "pnpm install";
    const safety = classifyCommand(bootstrap);
    if (safety.classification !== "allowed") {
      throw new Error(`Bootstrap command refused: ${safety.reason}`);
    }
    const commandResult = await adapter.runCommand(instance.instanceId, bootstrap);
    await addLog(job.id, `Bootstrap command result: ${commandResult.stdout || "ok"}`);

    await updateJob(job.id, { status: "starting", agentStatus: "starting website and Telegram agent" });
    await sleep(env.mode === "mock" ? 700 : 50);
    const exposed = await adapter.exposePort(instance.instanceId, env.defaultWebsitePort);
    await addLog(job.id, `Website exposed on ${exposed.url}`);
    await addLog(job.id, "Telegram agent listener ready. Webhook endpoint: /api/telegram/webhook");

    await updateJob(job.id, {
      status: "ready",
      websiteUrl: exposed.url,
      agentStatus: "ready"
    });
    await addLog(job.id, "Provisioning complete.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await updateJob(job.id, { status: "failed", error: message, agentStatus: "failed" });
    await addLog(job.id, `Provisioning failed: ${message}`);
  }
}

export function getProjectPath(job: JobRecord): string {
  return projectPath(job);
}
