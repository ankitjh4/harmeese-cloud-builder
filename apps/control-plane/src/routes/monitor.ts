import { Router } from "express";
import { getJob, listJobs } from "../services/jobStore.js";
import { getJobMonitor } from "../services/agentMonitor.js";

export const monitorRouter: Router = Router();

monitorRouter.get("/api/monitor", async (_req, res, next) => {
  try {
    const jobs = await listJobs();
    const monitors = await Promise.all(jobs.slice(0, 5).map((job) => getJobMonitor(job)));
    res.json({ monitors });
  } catch (error) {
    next(error);
  }
});

monitorRouter.get("/api/jobs/:id/monitor", async (req, res, next) => {
  try {
    const job = await getJob(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    return res.json({ monitor: await getJobMonitor(job) });
  } catch (error) {
    return next(error);
  }
});

