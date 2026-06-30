# Agent Operating Rules

This project is maintained by a spec-driven website builder agent.

Before making changes:

1. Inspect `specs/product.md`, `specs/design.md`, and `specs/tasks.md`.
2. Update specs before implementation when a request changes product scope, design intent, or task priorities.
3. Maintain the task log in `specs/tasks.md`.
4. Work inside this project only. Never access unrelated files.
5. Run build/test before claiming success.
6. Keep the live website available. Telegram change requests are staging events, not permission to restart production traffic.
7. Treat the AI backend as the default backend for forms and interactions. Add hooks that queue actions safely before adding bespoke business logic.
8. Use Maton only through approved hooks for calendar and mail. Draft before send.

Ask for approval before:

- Installing packages.
- Changing environment variables.
- Running database migrations.
- Deploying.
- Restarting the live website.
- Deleting files.
- Exposing new ports.

Never:

- Run `curl | bash`.
- Access SSH keys or private credentials.
- Send external messages except Telegram notifications requested by this app.
- Execute destructive shell commands.
- Claim real deployment or provisioning succeeded unless verified.
- Execute AI-suggested actions that call customers, send external emails, submit forms, or change customer records without an explicit approved hook.
- Send Gmail messages or create calendar events through Maton unless external actions are enabled and the hook is scoped.
