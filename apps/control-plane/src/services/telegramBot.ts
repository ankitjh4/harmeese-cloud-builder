import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { JobRecord } from "@harmeese/shared/types.js";
import { findLatestJobForChat } from "./jobStore.js";
import { addLog, getLogs } from "./logs.js";
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

function helpText(): string {
  return [
    "Harmeese Cloud Builder commands:",
    "/status",
    "/logs",
    "/spec",
    "/change <request>",
    "/deploy",
    "/help"
  ].join("\n");
}

async function queueChange(job: JobRecord, request: string): Promise<string> {
  const project = getProjectPath(job);
  const now = new Date().toISOString();
  const safeName = now.replace(/[:.]/g, "-");
  const tasksPath = join(project, "specs", "tasks.md");
  const existing = await readFile(tasksPath, "utf8").catch(() => "# Tasks\n");
  await writeFile(tasksPath, `${existing.trim()}\n\n## Telegram change request - ${now}\n\n- [ ] ${request}\n`);

  const runsDir = join(project, "agent_runs");
  await mkdir(runsDir, { recursive: true });
  await writeFile(join(runsDir, `${safeName}.md`), [
    `# Agent Run ${now}`,
    "",
    `User request: ${request}`,
    "",
    "Interpreted task: Queue a spec-driven website update for a future coding-agent run.",
    "",
    "Affected files:",
    "- specs/tasks.md",
    "- Future implementation files to be selected by the coding agent",
    "",
    "Proposed implementation steps:",
    "1. Inspect specs/product.md, specs/design.md, and specs/tasks.md.",
    "2. Update specs before implementation if the request changes product or design intent.",
    "3. Implement the smallest safe website change.",
    "4. Run build/test before reporting success.",
    "",
    "Status: queued",
    ""
  ].join("\n"));
  await addLog(job.id, `Queued Telegram change request: ${request}`);
  return "Change queued for spec-driven implementation. A patch plan was written under agent_runs/.";
}

export async function handleTelegramUpdate(update: TelegramUpdate): Promise<{ ok: true; reply?: string }> {
  const chatId = update.message?.chat.id?.toString();
  const text = update.message?.text?.trim() ?? "";
  if (!chatId || !text) return { ok: true };

  const job = await findLatestJobForChat(chatId);
  let reply = "";

  if (text === "/help" || text === "help") {
    reply = helpText();
  } else if (!job) {
    reply = "No ready Harmeese project is paired with this chat ID yet.";
  } else if (text === "/status") {
    reply = `Project: ${job.projectName}\nStatus: ${job.status}\nInstance: ${job.instanceId ?? "none"}\nWebsite: ${job.websiteUrl ?? "pending"}`;
  } else if (text === "/logs") {
    reply = (await getLogs(job.id)).slice(-10).join("\n") || "No logs yet.";
  } else if (text === "/spec") {
    const spec = await readFile(join(getProjectPath(job), "specs", "product.md"), "utf8").catch(() => "Spec not found.");
    reply = spec.slice(0, 3500);
  } else if (text.startsWith("/change ")) {
    const request = text.slice("/change ".length).trim();
    reply = request ? await queueChange(job, request) : "Usage: /change <request>";
  } else if (text === "/deploy") {
    await addLog(job.id, job.mode === "mock" ? "Mock deploy completed." : "Deploy requested for real provisioner hook.");
    reply = job.mode === "mock" ? "Mock deploy completed." : "Deploy hook queued for real provisioner integration.";
  } else {
    reply = helpText();
  }

  const token = job?.telegramBotToken;
  await sendTelegram(token, chatId, reply);
  return { ok: true, reply };
}
