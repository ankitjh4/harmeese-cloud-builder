import type { LeadInput } from "@harmeese/shared/types.js";
import type { StoredLead } from "./leadStore.js";

function formatLeadMessage(lead: LeadInput | StoredLead): string {
  const message = [
    "New website lead",
    "",
    `Name: ${lead.name}`,
    `Company: ${lead.company}`,
    `Email: ${lead.email}`,
    `Team size: ${lead.teamSize}`,
    `Interest: ${lead.interest}`,
    `Message: ${lead.message}`
  ];

  if ("aiHandling" in lead && lead.aiHandling) {
    message.push(
      "",
      "AI backend handling",
      `Backend: ${lead.aiHandling.backend}`,
      `Model: ${lead.aiHandling.model}`,
      `Priority: ${lead.aiHandling.priority}`,
      `Summary: ${lead.aiHandling.summary}`,
      "",
      "Recommended actions:",
      ...lead.aiHandling.recommendedActions.map((action) => `- ${action}`),
      "",
      "Draft reply:",
      lead.aiHandling.draftReply
    );
  }

  return [
    ...message,
    "",
    "Reply with:",
    "- draft reply",
    "- summarize",
    "- create proposal",
    "- update site <request>"
  ].join("\n");
}

export async function notifyLead(lead: LeadInput | StoredLead): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const text = formatLeadMessage(lead);

  if (!token || !chatId) {
    console.log(`[telegram notification skipped]\n${text}`);
    return;
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text })
  });

  if (!response.ok) {
    console.error(`Telegram notification failed: ${response.status} ${await response.text()}`);
  }
}
