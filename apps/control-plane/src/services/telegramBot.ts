import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { readEnv } from "@harmeese/shared/env.js";
import type { JobRecord } from "@harmeese/shared/types.js";
import { recordAgentEvent } from "./agentMonitor.js";
import { findLatestJobForChat, updateJob } from "./jobStore.js";
import { addLog, getLogs } from "./logs.js";
import { createOpenRouterPlan } from "./openRouterAgent.js";
import { getProjectPath } from "./provisioner.js";

export interface TelegramUpdate {
  message?: {
    chat: { id: number | string };
    text?: string;
  };
}

async function sendTelegram(token: string | undefined, chatId: string, text: string): Promise<void> {
  if (!token) {
    console.log(`[telegram mock] chat=${chatId} ${text}`);
    return;
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text })
  });
  if (!response.ok) {
    throw new Error(`Telegram send failed: ${response.status} ${await response.text()}`);
  }
}

export async function getTelegramBotSetup(): Promise<{
  configured: boolean;
  bot?: { id: number; username?: string; firstName?: string };
  recentChats: Array<{ id: string; type?: string; title?: string; username?: string; firstName?: string }>;
  error?: string;
}> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { configured: false, recentChats: [] };

  try {
    const [meResponse, updatesResponse] = await Promise.all([
      fetch(`https://api.telegram.org/bot${token}/getMe`),
      fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=20`)
    ]);
    if (!meResponse.ok) throw new Error(`getMe failed: ${meResponse.status}`);
    if (!updatesResponse.ok) throw new Error(`getUpdates failed: ${updatesResponse.status}`);

    const me = await meResponse.json() as { result?: { id: number; username?: string; first_name?: string } };
    const updates = await updatesResponse.json() as {
      result?: Array<{
        message?: {
          chat?: { id: number | string; type?: string; title?: string; username?: string; first_name?: string };
        };
      }>;
    };
    const seen = new Map<string, { id: string; type?: string; title?: string; username?: string; firstName?: string }>();
    for (const update of updates.result ?? []) {
      const chat = update.message?.chat;
      if (!chat) continue;
      const id = String(chat.id);
      seen.set(id, {
        id,
        type: chat.type,
        title: chat.title,
        username: chat.username,
        firstName: chat.first_name
      });
    }

    return {
      configured: true,
      bot: me.result ? { id: me.result.id, username: me.result.username, firstName: me.result.first_name } : undefined,
      recentChats: [...seen.values()]
    };
  } catch (error) {
    return {
      configured: true,
      recentChats: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function helpText(): string {
  return [
    "Harmeese Cloud Builder commands:",
    "/status",
    "/models",
    "/model <openrouter-model-id>",
    "/logs",
    "/spec",
    "/change <request>",
    "/deploy",
    "/help"
  ].join("\n");
}

const commonOpenRouterModels = [
  "openai/gpt-4o-mini",
  "openai/gpt-4o",
  "openai/gpt-4.1-mini",
  "anthropic/claude-3.5-sonnet",
  "anthropic/claude-3.7-sonnet",
  "google/gemini-2.0-flash-001",
  "meta-llama/llama-3.1-70b-instruct"
];

function publicWebsiteUrl(job: JobRecord): string {
  return readEnv().publicWebsiteUrl || job.websiteUrl || "pending";
}

function currentModel(job: JobRecord): string {
  return job.openrouterModel || readEnv().openrouterModel || "openai/gpt-4o-mini";
}

function normalizeText(text: string): string {
  return text.trim().toLowerCase();
}

function statusText(job: JobRecord): string {
  return [
    `Project: ${job.projectName}`,
    `Status: ${job.status}`,
    `Instance: ${job.instanceId ?? "none"}`,
    `Website: ${publicWebsiteUrl(job)}`,
    `Control plane: ${readEnv().controlPlaneUrl}`,
    `OpenRouter model: ${currentModel(job)}`
  ].join("\n");
}

function modelsText(job: JobRecord): string {
  return [
    `Current OpenRouter model: ${currentModel(job)}`,
    "",
    "Common model IDs:",
    ...commonOpenRouterModels.map((model) => `- ${model}`),
    "",
    "Set one with:",
    "/model <openrouter-model-id>"
  ].join("\n");
}

async function setModel(job: JobRecord, model: string): Promise<string> {
  const trimmed = model.trim();
  if (!/^[a-zA-Z0-9._:-]+\/[a-zA-Z0-9._:-]+$/.test(trimmed)) {
    return "Usage: /model <provider/model-id>\nExample: /model openai/gpt-4o-mini";
  }
  await updateJob(job.id, { openrouterModel: trimmed });
  await addLog(job.id, `OpenRouter model changed to ${trimmed}`);
  await recordAgentEvent(job.id, "openrouter", "OpenRouter model changed from Telegram.", { model: trimmed });
  return `OpenRouter model set to ${trimmed}. Future /change requests will use this model.`;
}

async function queueChange(job: JobRecord, request: string): Promise<string> {
  const project = getProjectPath(job);
  const now = new Date().toISOString();
  const safeName = now.replace(/[:.]/g, "-");
  const tasksPath = join(project, "specs", "tasks.md");
  const existing = await readFile(tasksPath, "utf8").catch(() => "# Tasks\n");
  await writeFile(tasksPath, `${existing.trim()}\n\n## Telegram change request - ${now}\n\n- [ ] ${request}\n`);

  const [productSpec, designSpec, tasksSpec] = await Promise.all([
    readFile(join(project, "specs", "product.md"), "utf8").catch(() => ""),
    readFile(join(project, "specs", "design.md"), "utf8").catch(() => ""),
    readFile(tasksPath, "utf8").catch(() => "")
  ]);
  const plan = job.agentBackend === "claude-code-placeholder"
    ? {
        backend: "placeholder" as const,
        model: "claude-code-placeholder",
        content: [
          "Claude Code placeholder selected.",
          "",
          "Interpreted task:",
          request,
          "",
          "Proposed implementation steps:",
          "1. Inspect specs.",
          "2. Prepare a scoped patch.",
          "3. Run build/test.",
          "4. Report changed files and verification."
        ].join("\n")
      }
    : await createOpenRouterPlan({
        job,
        env: readEnv(),
        request,
        productSpec,
        designSpec,
        tasksSpec
      });

  const runsDir = join(project, "agent_runs");
  await mkdir(runsDir, { recursive: true });
  await writeFile(join(runsDir, `${safeName}.md`), [
    `# Agent Run ${now}`,
    "",
    `User request: ${request}`,
    "",
    `Backend: ${plan.backend}`,
    `Model: ${plan.model}`,
    `Prompt pack: ${job.promptPack ?? "harmeese-webmaster"}`,
    "",
    "Agent plan:",
    "",
    plan.content,
    "",
    "Status: queued",
    ""
  ].join("\n"));
  await addLog(job.id, `Queued Telegram change request: ${request}`);
  await recordAgentEvent(job.id, "agent", "Queued Telegram change request.", { request });
  await recordAgentEvent(job.id, plan.backend === "openrouter" ? "openrouter" : "agent", "Created agent run plan.", {
    backend: plan.backend,
    model: plan.model,
    promptTokens: plan.tokensPrompt ?? 0,
    completionTokens: plan.tokensCompletion ?? 0
  });
  return "Change queued for spec-driven implementation. A patch plan was written under agent_runs/.";
}

export async function handleTelegramUpdate(update: TelegramUpdate): Promise<{ ok: true; reply?: string }> {
  const chatId = update.message?.chat.id?.toString();
  const text = update.message?.text?.trim() ?? "";
  if (!chatId || !text) return { ok: true };

  const job = await findLatestJobForChat(chatId);
  const normalized = normalizeText(text);
  let reply = "";

  if (normalized === "/help" || normalized === "help" || normalized === "commands") {
    reply = helpText();
  } else if (!job) {
    reply = "No ready Harmeese project is paired with this chat ID yet.";
  } else if (normalized === "/status" || normalized === "status" || normalized.includes("status")) {
    reply = statusText(job);
  } else if (normalized === "/models" || normalized === "models" || normalized === "model") {
    reply = modelsText(job);
  } else if (normalized.startsWith("/model ")) {
    reply = await setModel(job, text.slice("/model ".length));
  } else if (normalized.startsWith("use model ")) {
    reply = await setModel(job, text.slice("use model ".length));
  } else if (normalized === "/logs" || normalized === "logs" || normalized.includes("logs")) {
    reply = (await getLogs(job.id)).slice(-10).join("\n") || "No logs yet.";
  } else if (normalized === "/spec" || normalized === "spec" || normalized.includes("spec")) {
    const spec = await readFile(join(getProjectPath(job), "specs", "product.md"), "utf8").catch(() => "Spec not found.");
    reply = spec.slice(0, 3500);
  } else if (text.startsWith("/change ")) {
    const request = text.slice("/change ".length).trim();
    reply = request ? await queueChange(job, request) : "Usage: /change <request>";
  } else if (normalized === "/deploy" || normalized === "deploy") {
    const deployMessage = job.mode === "mock"
      ? "Mock deploy completed. Live website stayed online; staged changes were not applied automatically."
      : "Deploy requested for real provisioner hook. Production integration must health-check a staged build before traffic handoff.";
    await addLog(job.id, deployMessage);
    await recordAgentEvent(job.id, "deploy", deployMessage);
    reply = `${deployMessage}\nWebsite: ${publicWebsiteUrl(job)}`;
  } else if (text.startsWith("/")) {
    reply = helpText();
  } else {
    reply = await queueChange(job, text);
  }

  const token = job?.telegramBotToken ?? readEnv().telegramBotToken;
  await sendTelegram(token, chatId, reply);
  return { ok: true, reply };
}
