# Agent Operating Rules

This project is maintained by a spec-driven website builder agent.

Before making changes:

1. Inspect `specs/product.md`, `specs/design.md`, and `specs/tasks.md`.
2. Update specs before implementation when a request changes product scope, design intent, or task priorities.
3. Maintain the task log in `specs/tasks.md`.
4. Work inside this project only. Never access unrelated files.
5. Run build/test before claiming success.

Ask for approval before:

- Installing packages.
- Changing environment variables.
- Running database migrations.
- Deploying.
- Deleting files.
- Exposing new ports.

Never:

- Run `curl | bash`.
- Access SSH keys or private credentials.
- Send external messages except Telegram notifications requested by this app.
- Execute destructive shell commands.
- Claim real deployment or provisioning succeeded unless verified.
