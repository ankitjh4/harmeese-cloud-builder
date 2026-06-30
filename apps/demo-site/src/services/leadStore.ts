import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { LeadInput } from "@harmeese/shared/types.js";

export interface StoredLead extends LeadInput {
  id: string;
  createdAt: string;
}

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const leadsFile = join(repoRoot, ".harmeese", "leads.json");

async function readLeads(): Promise<StoredLead[]> {
  try {
    return JSON.parse(await readFile(leadsFile, "utf8")) as StoredLead[];
  } catch {
    return [];
  }
}

export async function saveLead(input: LeadInput): Promise<StoredLead> {
  const lead: StoredLead = {
    ...input,
    id: `lead-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString()
  };
  const leads = await readLeads();
  leads.unshift(lead);
  await mkdir(dirname(leadsFile), { recursive: true });
  await writeFile(leadsFile, JSON.stringify(leads, null, 2));
  return lead;
}

export function parseLead(body: Record<string, unknown>): LeadInput {
  const lead = {
    name: String(body.name ?? "").trim(),
    company: String(body.company ?? "").trim(),
    email: String(body.email ?? "").trim(),
    teamSize: String(body.teamSize ?? "").trim(),
    interest: String(body.interest ?? "").trim(),
    message: String(body.message ?? "").trim()
  };

  if (!lead.name || !lead.company || !lead.email || !lead.interest) {
    throw new Error("Name, company, email, and interest are required.");
  }
  return lead;
}
