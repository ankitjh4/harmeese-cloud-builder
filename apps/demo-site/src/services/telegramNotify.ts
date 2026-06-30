import type { LeadInput } from "@harmeese/shared/types.js";

function formatLeadMessage(lead: LeadInput): string {
  return [
    "New website lead",
    "",
    `Name: ${lead.name}`,
    `Company: ${lead.company}`,
    `Email: ${lead.email}`,
    `Team size: ${lead.teamSize}`,
    `Interest: ${lead.interest}`,
    `Message: ${lead.message}`,
    "",
    "Reply with:",
    "- draft reply",
    "- summarize",
    "- create proposal",
    "- update site <request>"
  ].join("\n");
}

export async function notifyLead(lead: LeadInput): Promise<void> {
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
