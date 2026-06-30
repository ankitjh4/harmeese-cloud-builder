# Harmeese Cloud Builder

One-click AI webmaster: launch a cloud coding agent that builds and maintains your website from Telegram.

Harmeese Cloud Builder is a self-hosted "OpenClaw for website builders" MVP. It gives you a local control plane, a mock JarvisLabs provisioning flow, a generated project template with specs and agent instructions, a demo AI training company website, Telegram command/lead notification integration, an OpenRouter-compatible agent planner, and a baked-in agent monitor.

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
    -> OpenRouter model planner for /change requests
    -> Agent monitor API and UI

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
Both apps bind to `0.0.0.0` for local network demos.

Copy `.env.example` to `.env` if you want to provide default tokens:

```bash
cp .env.example .env
```

The current apps read environment variables from the shell. You can also prefix commands:

```bash
TELEGRAM_BOT_TOKEN=... TELEGRAM_CHAT_ID=... pnpm dev
```

## OpenRouter Agent Backend

The default agent backend is `openrouter`. Add these values in `.env` or in the launch form:

```env
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=openai/gpt-4o-mini
```

When Telegram receives `/change <request>`, Harmeese:

1. Appends the request to `specs/tasks.md`.
2. Sends product/design/task context to OpenRouter if a key is configured.
3. Writes the returned implementation plan to `agent_runs/<timestamp>.md`.
4. Records events in the agent monitor.

If no OpenRouter key is configured, the same flow uses a local safe planner so demos do not crash.

## AI-First Website Backend

The demo website treats AI as the backend for visitor interactions. Lead form submissions now flow through:

```text
form submit
  -> AI backend handler
  -> lead summary / priority / draft reply / automation hooks
  -> local lead store
  -> Telegram notification
```

The AI backend can queue hooks such as internal form filling, reply drafting, proposal creation, and follow-up call tasks. The MVP deliberately queues these hooks instead of performing irreversible external side effects. If OpenRouter is unavailable, the website still saves the lead and uses a local fallback handling plan.

## Maton Calendar And Mail Hooks

Harmeese can use Maton as the gateway for external calendar and mail actions. Configure:

```env
MATON_API_KEY=...
MATON_ENABLE_EXTERNAL_ACTIONS=false
MATON_CALENDAR_CONNECTION_ID=
MATON_GMAIL_CONNECTION_ID=
MATON_FROM_EMAIL=
```

By default `MATON_ENABLE_EXTERNAL_ACTIONS=false`, so AI hooks are queued locally and reported in Telegram without touching Gmail or Calendar. When enabled, the demo site attempts to:

- create a Gmail draft through Maton for the AI-generated reply
- create a Google Calendar follow-up hold through Maton

The MVP does not automatically send emails or call customers. Those should remain explicit approved hooks.

## No-Downtime Change Contract

Telegram `/change` requests must not take the live website down. They are staged into `specs/tasks.md` and `agent_runs/`; deployment is a separate step. Production integration should use a health-checked staging build and only switch traffic after the new website is ready.

### Prompt Packs

The repo includes original, safe prompt packs:

- `harmeese-webmaster`
- `app-builder`
- `saas-landing`

They are inspired by common app-building workflows but do not vendor or reproduce leaked proprietary system prompts. If you have prompts you are legally allowed to use, add them as new prompt packs in `apps/control-plane/src/services/promptPacks.ts`.

## Agent Monitor

The control plane includes an agent monitor panel with:

- active backend
- model
- prompt pack
- queued run count
- recent provisioning/OpenRouter/Telegram/deploy events
- recent `agent_runs/*.md` files

APIs:

```http
GET /api/monitor
GET /api/jobs/:id/monitor
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
4. Exposes the website URL as `PUBLIC_WEBSITE_URL` when configured, otherwise `http://localhost:8080`.
5. Enables Telegram webhook commands for paired chat IDs.
6. Switches the local demo website preview to the selected boilerplate without restarting the site.

## Website Boilerplates

The launch UI includes these starter website types:

- AI Training Company Website
- SaaS Landing Page
- Course Platform
- Personal Portfolio
- Creator Link-in-Bio
- Consultant Website
- Local Service Business
- Event Speaker Page
- Nonprofit Campaign

Mock mode renders distinct copy, sections, CTA text, interest options, and lead form context for each boilerplate. Telegram changes and AI backend hooks work the same way across all of them.

## Real Mode

Real provisioning is intentionally isolated and disabled unless both variables are set:

```env
HARMESE_MODE=real
ALLOW_REAL_PROVISIONING=true
```

Real mode also requires JarvisLabs and Anthropic credentials. The real adapter is a safe placeholder in `packages/jarvislabs-adapter/src/realJarvis.ts`; it does not invent undocumented JarvisLabs APIs. Fill in official JarvisLabs CLI/SDK calls there after confirming the supported commands.

## Telegram Bot Setup

### 1. Create A Bot

1. In Telegram, open BotFather.
2. Send `/newbot`.
3. Choose a display name and username.
4. Copy the token BotFather gives you into `.env`:

```env
TELEGRAM_BOT_TOKEN=1234567890:replace-me
```

Keep this token private. Anyone with the token can control the bot.

### 2. Find Your Chat ID

Start the control plane locally or on your server:

```bash
pnpm dev
```

Open your bot in Telegram and send any message, for example:

```text
/start
```

Then open the setup endpoint:

```text
http://localhost:4000/api/telegram/setup
```

If the control plane is hosted remotely, use that host instead:

```text
https://<your-control-plane-host>/api/telegram/setup
```

The response includes `recentChats`. Copy the `id` for your private chat into `.env`:

```env
TELEGRAM_CHAT_ID=5051454777
```

After a webhook is configured, Telegram disables `getUpdates`, so this setup endpoint may return `getUpdates failed: 409`. That is expected once the webhook is live.

### 3. Configure Public URLs

Telegram webhooks require a public HTTPS URL. Localhost, private IPs, and plain HTTP URLs are not enough for Telegram's hosted Bot API.

For a public server, put Caddy or another HTTPS reverse proxy in front of the control plane:

```caddyfile
your-host.example.com {
  reverse_proxy 127.0.0.1:4000
}
```

Set the public control-plane URL in `.env`:

```env
CONTROL_PLANE_URL=https://your-host.example.com
```

If the demo website is reachable on a public URL, set it too. Telegram `/status` and `/deploy` replies prefer this URL over localhost:

```env
PUBLIC_WEBSITE_URL=http://your-host.example.com:8080
```

Restart the app after changing `.env`.

### 4. Set The Telegram Webhook

Configure Telegram to send updates to:

```text
https://<your-control-plane-host>/api/telegram/webhook
```

Using `curl`:

```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H "content-type: application/json" \
  -d '{"url":"https://<your-control-plane-host>/api/telegram/webhook","allowed_updates":["message"]}'
```

Supported commands:

- `/status`
- `/models`
- `/model <openrouter-model-id>`
- `/logs`
- `/spec`
- `/change <request>`
- `/deploy`
- `/help`

Natural-language messages are treated as change requests for the paired project. For example, sending `make the hero section more premium` queues the same flow as `/change make the hero section more premium`.

For `/change` and natural-language requests, the MVP queues a spec-driven task in `specs/tasks.md` and writes an `agent_runs/<timestamp>.md` plan. With OpenRouter configured, the plan is model-generated using the current OpenRouter model. It does not apply patches automatically yet.

Use `/models` to see the current model and common model IDs. Use `/model <provider/model>` to change the model stored on the paired job for future change requests.

## JarvisLabs Integration Notes

The adapter interface is complete:

- `createInstance`
- `getInstance`
- `runCommand`
- `exposePort`
- `stopInstance`

Mock mode is fully implemented. Real mode is guarded and stubbed. Add official JarvisLabs commands only in the real adapter, keep command construction allowlisted, and never pass raw Telegram/user input to a shell.

## Claude Code / Local Harness Notes

The generated project includes:

- `AGENTS.md`
- `CLAUDE.md`
- `specs/product.md`
- `specs/design.md`
- `specs/tasks.md`
- `agent/skills/*.md`
- `infra/start-agent.sh`

`infra/start-agent.sh` is the intended integration point for Claude Code or another local coding-agent harness. OpenRouter is the default MVP model bridge. The bootstrap script includes:

```bash
install_claude_code() {
  echo "TODO: optional Claude Code install goes here if this project uses the Claude Code harness"
}
```

Fill this in only after confirming the official install path for your environment.

## Security Model

- Mock mode is default.
- Real provisioning requires `HARMESE_MODE=real` and `ALLOW_REAL_PROVISIONING=true`.
- User-provided Telegram text is never executed as a shell command.
- OpenRouter output is saved as a plan, not executed as shell commands.
- Maton external actions are disabled unless `MATON_ENABLE_EXTERNAL_ACTIONS=true`.
- Gmail integration creates drafts, not sent messages, in the MVP.
- Leaked proprietary prompt content is not included; use only prompts you are allowed to use.
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
10. Open the Agent Monitor panel and see the generated run file/event.
11. Send `/deploy` and receive “Mock deploy completed.”

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
- Optionally invoke Claude Code or another local coding harness from queued `agent_runs/` plans.
- Add patch previews and approval workflow before live website changes.
- Add deployment targets beyond the local demo site.
