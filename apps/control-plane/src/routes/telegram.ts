import { Router } from "express";
import { getTelegramBotSetup, handleTelegramUpdate } from "../services/telegramBot.js";

export const telegramRouter: Router = Router();

telegramRouter.post("/api/telegram/webhook", async (req, res, next) => {
  try {
    res.json(await handleTelegramUpdate(req.body));
  } catch (error) {
    next(error);
  }
});

telegramRouter.get("/api/telegram/setup", async (_req, res, next) => {
  try {
    res.json(await getTelegramBotSetup());
  } catch (error) {
    next(error);
  }
});
