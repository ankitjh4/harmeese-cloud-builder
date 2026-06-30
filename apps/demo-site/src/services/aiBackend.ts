import type { LeadAiHandling, LeadInput } from "@harmeese/shared/types.js";

function localFallback(lead: LeadInput, reason: string): LeadAiHandling {
  const summary = `${lead.company} is interested in ${lead.interest || "AI training"} for a team of ${lead.teamSize || "unknown size"}.`;
  return {
    backend: "local-fallback",
    model: "local-lead-router",
    summary,
    priority: lead.message.length > 120 || Number.parseInt(lead.teamSize || "0", 10) >= 50 ? "high" : "medium",
    recommendedActions: [
      "draft reply",
      "summarize",
      "create proposal",
      "update CRM or task queue"
    ],
    draftReply: `Hi ${lead.name}, thanks for reaching out. We can help ${lead.company} plan a practical ${lead.interest} program. Could you share your preferred workshop timeline and primary team goals?`,
    automationHooks: [
      "fill internal lead record",
      "prepare customer reply",
      "queue proposal outline",
      "queue follow-up call task"
    ],
    rawPlan: `OpenRouter unavailable: ${reason}`
  };
}

function parseJsonPlan(text: string, lead: LeadInput, model: string): LeadAiHandling {
  try {
    const parsed = JSON.parse(text) as Partial<LeadAiHandling>;
    return {
      backend: "openrouter",
      model,
      summary: String(parsed.summary || `${lead.company} submitted a website lead.`),
      priority: parsed.priority === "low" || parsed.priority === "high" ? parsed.priority : "medium",
      recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions.map(String).slice(0, 6) : ["draft reply"],
      draftReply: String(parsed.draftReply || `Hi ${lead.name}, thanks for reaching out. We will follow up shortly.`),
      automationHooks: Array.isArray(parsed.automationHooks) ? parsed.automationHooks.map(String).slice(0, 6) : ["prepare customer reply"],
      rawPlan: text
    };
  } catch {
    return {
      ...localFallback(lead, "model returned non-JSON plan"),
      backend: "openrouter",
      model,
      rawPlan: text
    };
  }
}

export async function handleLeadWithAi(lead: LeadInput): Promise<LeadAiHandling> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
  if (!apiKey) return localFallback(lead, "OPENROUTER_API_KEY is not configured");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${apiKey}`,
      "content-type": "application/json",
      "http-referer": process.env.CONTROL_PLANE_URL || "http://localhost:4000",
      "x-title": "Harmeese Cloud Builder Demo Site"
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: [
            "You are the AI backend for a website. You handle form submissions, qualify leads, draft replies, and queue safe automation hooks.",
            "Return only JSON with keys: summary, priority, recommendedActions, draftReply, automationHooks.",
            "Do not claim that phone calls, emails, payments, or external CRM updates were completed. Queue them as hooks only."
          ].join("\n")
        },
        {
          role: "user",
          content: JSON.stringify({ lead })
        }
      ],
      temperature: 0.2,
      max_tokens: 700,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    return localFallback(lead, `OpenRouter request failed with ${response.status}`);
  }

  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) return localFallback(lead, "OpenRouter returned an empty handling plan");
  return parseJsonPlan(content, lead, model);
}

