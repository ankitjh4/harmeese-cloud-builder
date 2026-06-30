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
  | "course-platform";

export interface LaunchJobInput {
  projectName: string;
  jarvislabsApiKey?: string;
  anthropicApiKey?: string;
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

export type CommandSafety = "allowed" | "needs_approval" | "blocked";

export interface CommandClassification {
  classification: CommandSafety;
  reason: string;
}
