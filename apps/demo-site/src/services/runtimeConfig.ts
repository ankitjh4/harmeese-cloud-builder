import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isBoilerplate } from "@harmeese/shared/boilerplates.js";
import type { Boilerplate } from "@harmeese/shared/types.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const runtimeFile = join(repoRoot, ".harmeese", "demo-site-runtime.json");

export async function setRuntimeBoilerplate(boilerplate: Boilerplate): Promise<void> {
  await mkdir(dirname(runtimeFile), { recursive: true });
  await writeFile(runtimeFile, JSON.stringify({ boilerplate, updatedAt: new Date().toISOString() }, null, 2));
}

export async function getRuntimeBoilerplate(): Promise<Boilerplate> {
  try {
    const parsed = JSON.parse(await readFile(runtimeFile, "utf8")) as { boilerplate?: string };
    const savedBoilerplate = parsed.boilerplate;
    if (isBoilerplate(savedBoilerplate)) return savedBoilerplate;
  } catch {
    // Fall through to environment/default.
  }

  const envBoilerplate = process.env.BOILERPLATE;
  return isBoilerplate(envBoilerplate) ? envBoilerplate : "ai-training-company";
}
