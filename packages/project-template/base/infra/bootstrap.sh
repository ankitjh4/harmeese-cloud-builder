#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME="${PROJECT_NAME:-harmeese-generated-site}"
PROJECT_DIR="${PROJECT_DIR:-$HOME/$PROJECT_NAME}"
WEBSITE_PORT="${WEBSITE_PORT:-8080}"
CONTROL_PLANE_URL="${CONTROL_PLANE_URL:-http://localhost:4000}"

log() {
  printf '[harmeese-bootstrap] %s\n' "$1"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "Missing required command: $1"
    return 1
  fi
}

install_claude_code() {
  log "TODO: install Claude Code or compatible coding agent here"
  log "Fill this function after confirming the official install command for your environment."
}

prepare_project_dir() {
  mkdir -p "$PROJECT_DIR"
  log "Project directory ready: $PROJECT_DIR"
}

check_runtime() {
  require_command node
  require_command git
  if ! command -v pnpm >/dev/null 2>&1; then
    log "pnpm is not installed. Install with corepack or your approved package manager before continuing."
    exit 1
  fi
}

write_env() {
  cat > "$PROJECT_DIR/.env" <<ENV
PROJECT_NAME=$PROJECT_NAME
WEBSITE_PORT=$WEBSITE_PORT
CONTROL_PLANE_URL=$CONTROL_PLANE_URL
TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN:-}
TELEGRAM_CHAT_ID=${TELEGRAM_CHAT_ID:-}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-}
ENV
  chmod 600 "$PROJECT_DIR/.env"
  log "Wrote environment file."
}

install_dependencies() {
  if [ -f "$PROJECT_DIR/package.json" ]; then
    (cd "$PROJECT_DIR" && pnpm install)
  else
    log "No package.json found in $PROJECT_DIR; skipping dependency install."
  fi
}

start_website() {
  if [ -f "$PROJECT_DIR/package.json" ]; then
    (cd "$PROJECT_DIR" && WEBSITE_PORT="$WEBSITE_PORT" pnpm start >/tmp/harmeese-website.log 2>&1 &)
    log "Website start command issued on port $WEBSITE_PORT."
  else
    log "No package.json found; website start skipped."
  fi
}

start_agent() {
  "$PROJECT_DIR/infra/start-agent.sh" || true
}

main() {
  prepare_project_dir
  check_runtime
  install_claude_code
  write_env
  install_dependencies
  start_website
  start_agent
  log "Website URL: http://localhost:$WEBSITE_PORT"
  log "Control plane: $CONTROL_PLANE_URL"
  log "Status: bootstrap complete"
}

main "$@"
