import type { LeadAiHandling, LeadInput } from "@harmeese/shared/types.js";

export interface ActionHookResult {
  hook: string;
  status: "queued" | "skipped";
  note: string;
}

export async function queueAiActionHooks(lead: LeadInput, handling: LeadAiHandling): Promise<ActionHookResult[]> {
  return handling.automationHooks.map((hook) => ({
    hook,
    status: "queued",
    note: `AI backend queued ${hook} for ${lead.company}. External side effects remain disabled in the MVP.`
  }));
}

