# Harmeese Cloud Builder

One-click AI webmaster: launch a cloud coding agent that builds and maintains your website from Telegram.

Harmeese Cloud Builder is a self-hosted "OpenClaw for website builders" MVP. It gives you a local control plane, a mock JarvisLabs provisioning flow, a generated project template with specs and agent instructions, a demo AI training company website, and Telegram command/lead notification integration.

## Demo Screenshots

Screenshots are intentionally left as placeholders for your demo deck:

- Control plane launch form
- Provisioning logs and ready state
- Demo website lead form
- Telegram lead alert and `/change` command

## Architecture

```text
Browser admin UI
  -> apps/control-plane Express API
    -> JSON job/log store under .harmeese/
    -> JarvisLabs adapter
      -> mock adapter: localhost demo
      -> real adapter: gated placeholder behind ALLOW_REAL_PROVISIONING=true
    -> project template materialized under .harmeese/projects/
    -> Telegram webhook command handler

apps/demo-site Express app
  -> AI training landing page
  -> lead JSON store under .harmeese/
  -> Telegram Bot API notification, or local log fallback
```

## Local Setup

```bash
pnpm install
pnpm dev
```

The control plane runs at `http://localhost:4000`.
The demo website runs at `http://localhost:8080`.

Copy `.env.example` to `.env` if you want to provide default tokens:

```bash
cp .env.example .env
```

The current apps read environment variables from the shell. You can also prefix commands:

```bash
TELEGRAM_BOT_TOKEN=... TELEGRAM_CHAT_ID=... pnpm dev
```

## Mock Mode

Mock mode is the default:

```env
HARMESE_MODE=mock
ALLOW_REAL_PROVISIONING=false
```

In mock mode, launching a job:

1. Creates a fake JarvisLabs instance ID.
2. Copies `packages/project-template/base` into `.harmeese/projects/<job>/<project>/`.
3. Simulates install/start stages with real logs.
4. Exposes the website URL as `http://localhost:8080`.
5. Enables Telegram webhook commands for paired chat IDs.

## Real Mode

Real provisioning is intentionally isolated and disabled unless both variables are set:

```env
HARMESE_MODE=real
ALLOW_REAL_PROVISIONING=true
```

Real mode also requires JarvisLabs and Anthropic credentials. The real adapter is a safe placeholder in `packages/jarvislabs-adapter/src/realJarvis.ts`; it does not invent undocumented JarvisLabs APIs. Fill in official JarvisLabs CLI/SDK calls there after confirming the supported commands.

## Telegram Bot Setup

1. Create a bot with BotFather.
2. Copy the bot token into the control plane form or `TELEGRAM_BOT_TOKEN`.
3. Find your chat ID and enter it in the form or `TELEGRAM_CHAT_ID`.
4. Configure Telegram to send updates to:

```text
http://<your-control-plane-host>/api/telegram/webhook
```

Supported commands:

- `/status`
- `/logs`
- `/spec`
- `/change <request>`
- `/deploy`
- `/help`

For `/change`, the MVP queues a spec-driven task in `specs/tasks.md` and writes an `agent_runs/<timestamp>.md` plan. It does not run Claude Code automatically yet.

## JarvisLabs Integration Notes

The adapter interface is complete:

- `createInstance`
- `getInstance`
- `runCommand`
- `exposePort`
- `stopInstance`

Mock mode is fully implemented. Real mode is guarded and stubbed. Add official JarvisLabs commands only in the real adapter, keep command construction allowlisted, and never pass raw Telegram/user input to a shell.

## Claude Code Integration Notes

The generated project includes:

- `AGENTS.md`
- `CLAUDE.md`
- `specs/product.md`
- `specs/design.md`
- `specs/tasks.md`
- `agent/skills/*.md`
- `infra/start-agent.sh`

`infra/start-agent.sh` is the intended integration point for Claude Code or a Claude-compatible coding-agent bridge. The bootstrap script includes:

```bash
install_claude_code() {
  echo "TODO: install Claude Code or compatible coding agent here"
}
```

Fill this in only after confirming the official install path for your environment.

## Security Model

- Mock mode is default.
- Real provisioning requires `HARMESE_MODE=real` and `ALLOW_REAL_PROVISIONING=true`.
- User-provided Telegram text is never executed as a shell command.
- `packages/shared/src/safety.ts` classifies commands as `allowed`, `needs_approval`, or `blocked`.
- The real adapter refuses non-allowlisted commands.
- Blocked examples include SSH key reads, `curl | bash`, privilege escalation shells, and destructive root deletion.
- Approval-required examples include package additions, migrations, production deploys, `.env` changes, port exposure, and deletion.

## Demo Script

1. Launch control plane: `pnpm dev`.
2. Open `http://localhost:4000`.
3. Create mock AI builder with project name `neuraledge-academy`.
4. Wait for job status `ready`.
5. Open generated website at `http://localhost:8080`.
6. Submit the lead form.
7. Receive Telegram alert, or see the notification logged when keys are absent.
8. Send `/change add a workshop for legal teams`.
9. See the spec task queued in `.harmeese/projects/<job>/neuraledge-academy/specs/tasks.md`.
10. Send `/deploy` and receive “Mock deploy completed.”

## Scripts

```bash
pnpm install
pnpm dev
pnpm build
pnpm test
pnpm lint
```

## Roadmap

- Replace the real JarvisLabs placeholder with official CLI/SDK calls.
- Add authenticated control plane access.
- Add persistent SQLite storage.
- Add a Telegram pairing flow.
- Invoke Claude Code from queued `agent_runs/` plans.
- Add patch previews and approval workflow before live website changes.
- Add deployment targets beyond the local demo site.
