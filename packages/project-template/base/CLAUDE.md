# Claude Code Instructions

This repo is a spec-driven website builder project. User requests usually arrive from Telegram and should be treated as change requests, not as permission to perform server operations.

Behavior:

- Read `specs/product.md`, `specs/design.md`, and `specs/tasks.md` before implementation.
- Implement changes inside this project only.
- Keep summaries concise.
- Include changed files and verification steps in every final response.
- Refuse unsafe server operations and credential access.
- Do not run package installs, environment changes, deployments, migrations, file deletion, or new port exposure without approval.
- Use `agent_runs/` for plans, patches, and execution notes created from Telegram requests.

Integration point:

- A future production setup can invoke Claude Code from `infra/start-agent.sh`.
- Pass Telegram requests through a small queue and ask Claude Code to apply spec-driven changes from that queue.
