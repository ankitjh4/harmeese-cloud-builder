import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { readEnv } from "@harmeese/shared/env.js";
import { healthRouter } from "./routes/health.js";
import { jobsRouter } from "./routes/jobs.js";
import { monitorRouter } from "./routes/monitor.js";
import { telegramRouter } from "./routes/telegram.js";

const env = readEnv();
const app = express();
const sourceDir = dirname(fileURLToPath(import.meta.url));
const webDir = resolve(sourceDir, "..", "web");

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(healthRouter);
app.use(jobsRouter(env));
app.use(monitorRouter);
app.use(telegramRouter);

app.use(express.static(webDir));

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  res.status(400).json({ error: message });
});

app.listen(env.port, "0.0.0.0", () => {
  console.log(`Harmeese Cloud Builder control plane listening on http://0.0.0.0:${env.port}`);
  console.log(`Mode: ${env.mode}; real provisioning allowed: ${env.allowRealProvisioning}`);
});
