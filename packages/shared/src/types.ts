export type HarmeeseMode = "mock" | "real";

export type JobStatus =
  | "queued"
  | "provisioning"
  | "installing"
  | "starting"
  | "ready"
  | "failed";

export type Boilerplate =
  | "ai-training-company"
  | "saas-landing-page"
  | "course-platform"
  | "personal-portfolio"
  | "creator-link-in-bio"
  | "consultant-website"
  | "local-service-business"
  | "event-speaker-page"
  | "nonprofit-campaign";

export type AgentBackend =
  | "openrouter"
  | "claude-code-placeholder";

export type PromptPack =
  | "harmeese-webmaster"
  | "app-builder"
  | "saas-landing";

export interface LaunchJobInput {
  projectName: string;
  jarvislabsApiKey?: string;
  anthropicApiKey?: string;
  openrouterApiKey?: string;
  openrouterModel?: string;
  agentBackend?: AgentBackend;
  promptPack?: PromptPack;
  telegramBotToken?: string;
  telegramChatId?: string;
  boilerplate: Boilerplate;
}

export interface JobRecord extends LaunchJobInput {
  id: string;
  status: JobStatus;
  mode: HarmeeseMode;
  createdAt: string;
  updatedAt: string;
  instanceId?: string;
  websiteUrl?: string;
  agentStatus?: string;
  error?: string;
}

export interface LeadInput {
  name: string;
  company: string;
  email: string;
  teamSize: string;
  interest: string;
  message: string;
}

export interface LeadAiHandling {
  backend: "openrouter" | "local-fallback";
  model: string;
  summary: string;
  priority: "low" | "medium" | "high";
  recommendedActions: string[];
  draftReply: string;
  automationHooks: string[];
  rawPlan?: string;
}

export interface AiActionResult {
  hook: string;
  provider: "maton" | "local-queue";
  status: "queued" | "drafted" | "scheduled" | "skipped" | "failed";
  note: string;
  externalId?: string;
}

export type CommandSafety = "allowed" | "needs_approval" | "blocked";

export interface CommandClassification {
  classification: CommandSafety;
  reason: string;
}

export type AgentEventType =
  | "job"
  | "agent"
  | "openrouter"
  | "telegram"
  | "deploy"
  | "error";

export interface AgentEvent {
  id: string;
  jobId: string;
  type: AgentEventType;
  message: string;
  createdAt: string;
  metadata?: Record<string, string | number | boolean>;
}
