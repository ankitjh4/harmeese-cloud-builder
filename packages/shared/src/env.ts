import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { HarmeeseMode } from "./types.js";

export interface AppEnv {
  nodeEnv: string;
  port: number;
  mode: HarmeeseMode;
  jarvislabsApiKey: string;
  anthropicApiKey: string;
  openrouterApiKey: string;
  openrouterModel: string;
  telegramBotToken: string;
  telegramChatId: string;
  defaultProjectName: string;
  defaultWebsitePort: number;
  controlPlaneUrl: string;
  allowRealProvisioning: boolean;
}

function findEnvFile(path: string): string | undefined {
  if (existsSync(path)) return path;
  if (path !== ".env") return undefined;

  let current = process.cwd();
  for (let depth = 0; depth < 8; depth += 1) {
    const candidate = join(current, ".env");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return undefined;
}

export function loadEnvFile(path = ".env"): void {
  const envFile = findEnvFile(path);
  if (!envFile) return;
  const lines = readFileSync(resolve(envFile), "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function readEnv(): AppEnv {
  loadEnvFile();
  const mode = process.env.HARMESE_MODE === "real" ? "real" : "mock";
  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: intEnv("PORT", 4000),
    mode,
    jarvislabsApiKey: process.env.JARVISLABS_API_KEY ?? "",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
    openrouterApiKey: process.env.OPENROUTER_API_KEY ?? "",
    openrouterModel: process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini",
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
    telegramChatId: process.env.TELEGRAM_CHAT_ID ?? "",
    defaultProjectName: process.env.DEFAULT_PROJECT_NAME ?? "ai-training-site",
    defaultWebsitePort: intEnv("DEFAULT_WEBSITE_PORT", 8080),
    controlPlaneUrl: process.env.CONTROL_PLANE_URL ?? "http://localhost:4000",
    allowRealProvisioning: process.env.ALLOW_REAL_PROVISIONING === "true"
  };
}
