import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Boilerplate } from "@harmeese/shared/types.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const runtimeFile = join(repoRoot, ".harmeese", "demo-site-runtime.json");

export async function setDemoSiteBoilerplate(boilerplate: Boilerplate): Promise<void> {
  await mkdir(dirname(runtimeFile), { recursive: true });
  await writeFile(runtimeFile, JSON.stringify({ boilerplate, updatedAt: new Date().toISOString() }, null, 2));
}
