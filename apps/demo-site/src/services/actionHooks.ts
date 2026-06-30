import type { AiActionResult, LeadAiHandling, LeadInput } from "@harmeese/shared/types.js";
import { createMatonCalendarHold, createMatonGmailDraft, matonEnabled } from "./matonClient.js";

function localQueue(lead: LeadInput, handling: LeadAiHandling): AiActionResult[] {
  return handling.automationHooks.map((hook) => ({
    hook,
    provider: "local-queue",
    status: "queued",
    note: `AI backend queued ${hook} for ${lead.company}. External side effects remain disabled in the MVP.`
  }));
}

export async function queueAiActionHooks(lead: LeadInput, handling: LeadAiHandling): Promise<AiActionResult[]> {
  const queued = localQueue(lead, handling);
  if (!matonEnabled()) {
    return [
      ...queued,
      {
        hook: "maton calendar and mail",
        provider: "maton",
        status: "skipped",
        note: "Maton external actions are disabled. Set MATON_ENABLE_EXTERNAL_ACTIONS=true and MATON_API_KEY to create calendar holds and Gmail drafts."
      }
    ];
  }

  const results: AiActionResult[] = [...queued];
  try {
    const draft = await createMatonGmailDraft(lead, handling);
    results.push({
      hook: "create Gmail draft",
      provider: "maton",
      status: draft.ok ? "drafted" : "failed",
      note: draft.note,
      externalId: draft.id
    });
  } catch (error) {
    results.push({
      hook: "create Gmail draft",
      provider: "maton",
      status: "failed",
      note: error instanceof Error ? error.message : String(error)
    });
  }

  try {
    const event = await createMatonCalendarHold(lead, handling);
    results.push({
      hook: "create calendar follow-up hold",
      provider: "maton",
      status: event.ok ? "scheduled" : "failed",
      note: event.note,
      externalId: event.id
    });
  } catch (error) {
    results.push({
      hook: "create calendar follow-up hold",
      provider: "maton",
      status: "failed",
      note: error instanceof Error ? error.message : String(error)
    });
  }

  return results;
}
