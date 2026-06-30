import type { LeadAiHandling, LeadInput } from "@harmeese/shared/types.js";

interface MatonResult {
  ok: boolean;
  id?: string;
  note: string;
}

function headers(connectionId?: string): Record<string, string> {
  const apiKey = process.env.MATON_API_KEY;
  if (!apiKey) throw new Error("MATON_API_KEY is not configured.");
  return {
    "authorization": `Bearer ${apiKey}`,
    "content-type": "application/json",
    ...(connectionId ? { "maton-connection": connectionId } : {})
  };
}

function base64Url(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function matonEnabled(): boolean {
  return process.env.MATON_ENABLE_EXTERNAL_ACTIONS === "true" && Boolean(process.env.MATON_API_KEY);
}

export async function createMatonCalendarHold(lead: LeadInput, handling: LeadAiHandling): Promise<MatonResult> {
  const text = encodeURIComponent(`Follow up with ${lead.name} at ${lead.company} about ${lead.interest} tomorrow at 10am`);
  const url = `https://gateway.maton.ai/google-calendar/calendar/v3/calendars/primary/events/quickAdd?text=${text}`;
  const response = await fetch(url, {
    method: "POST",
    headers: headers(process.env.MATON_CALENDAR_CONNECTION_ID)
  });
  if (!response.ok) return { ok: false, note: `Maton calendar request failed with ${response.status}.` };
  const data = await response.json() as { id?: string; htmlLink?: string };
  return {
    ok: true,
    id: data.id,
    note: `Calendar follow-up hold created${data.htmlLink ? `: ${data.htmlLink}` : "."} Summary: ${handling.summary}`
  };
}

export async function createMatonGmailDraft(lead: LeadInput, handling: LeadAiHandling): Promise<MatonResult> {
  const from = process.env.MATON_FROM_EMAIL || "me";
  const subject = `Re: ${lead.interest || "AI training"} at ${lead.company}`;
  const raw = [
    `From: ${from}`,
    `To: ${lead.email}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    handling.draftReply
  ].join("\r\n");

  const response = await fetch("https://gateway.maton.ai/google-mail/gmail/v1/users/me/drafts", {
    method: "POST",
    headers: headers(process.env.MATON_GMAIL_CONNECTION_ID),
    body: JSON.stringify({ message: { raw: base64Url(raw) } })
  });
  if (!response.ok) return { ok: false, note: `Maton Gmail draft request failed with ${response.status}.` };
  const data = await response.json() as { id?: string; message?: { id?: string } };
  return {
    ok: true,
    id: data.id ?? data.message?.id,
    note: "Gmail draft created through Maton. It was not sent automatically."
  };
}

