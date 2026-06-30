import type { AppEnv } from "@harmeese/shared/env.js";
import type { JobRecord } from "@harmeese/shared/types.js";
import { getPromptPack } from "./promptPacks.js";

interface OpenRouterPlanInput {
  job: JobRecord;
  env: AppEnv;
  request: string;
  productSpec: string;
  designSpec: string;
  tasksSpec: string;
}

export interface AgentPlanResult {
  backend: "openrouter" | "placeholder";
  model: string;
  content: string;
  tokensPrompt?: number;
  tokensCompletion?: number;
}

function fallbackPlan(input: OpenRouterPlanInput, reason: string): AgentPlanResult {
  return {
    backend: "placeholder",
    model: "local-safe-planner",
    content: [
      `OpenRouter plan unavailable: ${reason}`,
      "",
      "Interpreted task:",
      input.request,
      "",
      "Affected files:",
      "- specs/tasks.md",
      "- Website files selected by the future coding-agent run",
      "",
      "Proposed implementation steps:",
      "1. Read specs/product.md, specs/design.md, and specs/tasks.md.",
      "2. Update the specs if the request changes product or design intent.",
      "3. Implement the smallest scoped website/app change.",
      "4. Run build, lint, and focused tests before reporting success.",
      "",
      "Safety notes:",
      "- Do not execute Telegram text as shell commands.",
      "- Do not access secrets or unrelated files."
    ].join("\n")
  };
}

export async function createOpenRouterPlan(input: OpenRouterPlanInput): Promise<AgentPlanResult> {
  const apiKey = input.job.openrouterApiKey || input.env.openrouterApiKey;
  const model = input.job.openrouterModel || input.env.openrouterModel || "openai/gpt-4o-mini";
  if (!apiKey) return fallbackPlan(input, "OPENROUTER_API_KEY is not configured.");

  const promptPack = getPromptPack(input.job.promptPack);
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${apiKey}`,
      "content-type": "application/json",
      "http-referer": input.env.controlPlaneUrl,
      "x-title": "Harmeese Cloud Builder"
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: promptPack.system },
        {
          role: "user",
          content: [
            `Project: ${input.job.projectName}`,
            `Boilerplate: ${input.job.boilerplate}`,
            `Prompt pack: ${promptPack.label}`,
            "",
            "Product spec:",
            input.productSpec.slice(0, 4000),
            "",
            "Design spec:",
            input.designSpec.slice(0, 3000),
            "",
            "Current tasks:",
            input.tasksSpec.slice(-3000),
            "",
            "Telegram change request:",
            input.request,
            "",
            "Return a concise markdown plan with: interpreted task, affected files, implementation steps, validation, and safety notes. Do not execute anything."
          ].join("\n")
        }
      ],
      temperature: 0.2,
      max_tokens: 900
    })
  });

  if (!response.ok) {
    return fallbackPlan(input, `OpenRouter request failed with ${response.status}: ${await response.text()}`);
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) return fallbackPlan(input, "OpenRouter returned an empty plan.");

  return {
    backend: "openrouter",
    model,
    content,
    tokensPrompt: data.usage?.prompt_tokens,
    tokensCompletion: data.usage?.completion_tokens
  };
}
