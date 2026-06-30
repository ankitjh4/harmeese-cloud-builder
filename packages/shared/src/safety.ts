import type { CommandClassification } from "./types.js";

const blockedPatterns = [
  /\brm\s+-rf\s+\/(?:\s|$)/i,
  /\bcat\s+~\/\.ssh\/id_rsa\b/i,
  /\bcat\s+.*\/\.ssh\/id_rsa\b/i,
  /\bcurl\b.*\|\s*bash\b/i,
  /\bwget\b.*\|\s*(bash|sh)\b/i,
  /\bsudo\s+su\b/i,
  /\bchmod\s+-R\s+777\s+\/(?:\s|$)/i,
  /\bscp\s+~\/\.ssh\/\*/i,
  /\bssh\s+-i\s+~\/\.ssh\b/i
];

const approvalPatterns = [
  /\bnpm\s+install\s+\S+/i,
  /\bpnpm\s+add\s+\S+/i,
  /\byarn\s+add\s+\S+/i,
  /\balter\s+database\b/i,
  /\bmigration\b/i,
  /\bdeploy\s+production\b/i,
  /\bchange\s+\.env\b/i,
  /\bexpose\s+port\b/i,
  /\bdelete\s+file\b/i,
  /\brm\s+/i
];

const allowedPatterns = [
  /^pnpm install$/i,
  /^pnpm build$/i,
  /^pnpm test$/i,
  /^pnpm start$/i,
  /^pnpm dev$/i,
  /^git status(?: --short)?$/i,
  /^ls(?:\s+[-\w./]+)?$/i,
  /^cat\s+specs\/[\w.-]+\.md$/i,
  /^node\s+dist\/server\.js$/i
];

export function classifyCommand(command: string): CommandClassification {
  const normalized = command.trim();
  if (!normalized) {
    return { classification: "blocked", reason: "Empty commands are not executable." };
  }

  if (blockedPatterns.some((pattern) => pattern.test(normalized))) {
    return { classification: "blocked", reason: "Command matches a blocked unsafe operation." };
  }

  if (approvalPatterns.some((pattern) => pattern.test(normalized))) {
    return { classification: "needs_approval", reason: "Command changes dependencies, environment, data, ports, or files." };
  }

  if (allowedPatterns.some((pattern) => pattern.test(normalized))) {
    return { classification: "allowed", reason: "Command is on the safe allowlist." };
  }

  return { classification: "needs_approval", reason: "Command is not on the allowlist." };
}
