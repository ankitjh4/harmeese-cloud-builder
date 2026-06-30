import express from "express";
import { loadEnvFile } from "@harmeese/shared/env.js";
import { landingPage } from "./pages/landing.js";
import { handleLeadWithAi } from "./services/aiBackend.js";
import { queueAiActionHooks } from "./services/actionHooks.js";
import { notifyLead } from "./services/telegramNotify.js";
import { parseLead, saveLead } from "./services/leadStore.js";

loadEnvFile();
const port = Number.parseInt(process.env.DEFAULT_WEBSITE_PORT ?? process.env.WEBSITE_PORT ?? "8080", 10);
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true, service: "harmeese-demo-site" }));
app.get("/", (req, res) => res.type("html").send(landingPage(req.query.success === "1")));

app.post("/lead", async (req, res, next) => {
  try {
    const lead = parseLead(req.body);
    const aiHandling = await handleLeadWithAi(lead);
    const actionResults = await queueAiActionHooks(lead, aiHandling);
    const storedLead = await saveLead(lead, aiHandling, actionResults);
    await notifyLead(storedLead);
    res.redirect("/?success=1#lead");
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  res.status(400).type("html").send(`<p>${message}</p><p><a href="/">Back</a></p>`);
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Harmeese demo site listening on http://0.0.0.0:${port}`);
});
