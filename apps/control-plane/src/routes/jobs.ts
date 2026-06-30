import { Router } from "express";
import type { AppEnv } from "@harmeese/shared/env.js";
import type { AgentBackend, Boilerplate, LaunchJobInput, PromptPack } from "@harmeese/shared/types.js";
import { createJob, getJob, listJobs } from "../services/jobStore.js";
import { getLogs } from "../services/logs.js";
import { runProvisioning } from "../services/provisioner.js";

const boilerplates: Boilerplate[] = ["ai-training-company", "saas-landing-page", "course-platform"];
const agentBackends: AgentBackend[] = ["openrouter", "claude-code-placeholder"];
const promptPacks: PromptPack[] = ["harmeese-webmaster", "app-builder", "saas-landing"];

function parseLaunch(body: Partial<LaunchJobInput>, env: AppEnv): LaunchJobInput {
  const projectName = (body.projectName || env.defaultProjectName).trim();
  const boilerplate = body.boilerplate && boilerplates.includes(body.boilerplate)
    ? body.boilerplate
    : "ai-training-company";
  const agentBackend = body.agentBackend && agentBackends.includes(body.agentBackend)
    ? body.agentBackend
    : "openrouter";
  const promptPack = body.promptPack && promptPacks.includes(body.promptPack)
    ? body.promptPack
    : "harmeese-webmaster";
  if (!/^[a-zA-Z0-9][a-zA-Z0-9-_]{1,62}$/.test(projectName)) {
    throw new Error("Project name must be 2-63 characters and contain only letters, numbers, dashes, and underscores.");
  }
  return {
    projectName,
    jarvislabsApiKey: body.jarvislabsApiKey?.trim(),
    anthropicApiKey: body.anthropicApiKey?.trim(),
    openrouterApiKey: body.openrouterApiKey?.trim(),
    openrouterModel: body.openrouterModel?.trim(),
    agentBackend,
    promptPack,
    telegramBotToken: body.telegramBotToken?.trim(),
    telegramChatId: body.telegramChatId?.trim(),
    boilerplate
  };
}

export function jobsRouter(env: AppEnv): Router {
  const router = Router();

  router.get("/api/jobs", async (_req, res, next) => {
    try {
      res.json({ jobs: await listJobs() });
    } catch (error) {
      next(error);
    }
  });

  router.post("/api/jobs", async (req, res, next) => {
    try {
      const input = parseLaunch(req.body, env);
      const job = await createJob(input, env.mode);
      res.status(202).json({ jobId: job.id, status: job.status });
      void runProvisioning(job, env);
    } catch (error) {
      next(error);
    }
  });

  router.get("/api/jobs/:id", async (req, res, next) => {
    try {
      const job = await getJob(req.params.id);
      if (!job) return res.status(404).json({ error: "Job not found" });
      return res.json({ job });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/api/jobs/:id/logs", async (req, res, next) => {
    try {
      res.json({ logs: await getLogs(req.params.id) });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
