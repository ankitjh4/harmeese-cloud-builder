# Skill: Telegram Notifier

Use this skill for lead notifications and Telegram command handling.

Rules:

- Send only requested app notifications.
- Never send external emails or payment actions.
- Keep lead messages concise and include suggested actions.
- For `/change`, queue the task and create an `agent_runs/` note instead of making unsafe live changes.
