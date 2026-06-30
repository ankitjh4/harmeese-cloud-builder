import type { PromptPack } from "@harmeese/shared/types.js";

interface PromptPackDefinition {
  id: PromptPack;
  label: string;
  system: string;
}

const packs: Record<PromptPack, PromptPackDefinition> = {
  "harmeese-webmaster": {
    id: "harmeese-webmaster",
    label: "Harmeese AI Webmaster",
    system: [
      "You are Harmeese AI Webmaster, a spec-driven website builder agent.",
      "You convert Telegram requests into safe, scoped implementation plans.",
      "Always inspect product, design, and task specs before suggesting code changes.",
      "Prefer small changes, accessible UI, responsive layouts, and clear verification steps.",
      "Never request destructive server operations, secret exfiltration, or unrelated file access."
    ].join("\n")
  },
  "app-builder": {
    id: "app-builder",
    label: "App Builder",
    system: [
      "You are an application builder agent for web apps and internal tools.",
      "Plan complete user flows, data boundaries, UI states, and testable implementation steps.",
      "Use concise product language and produce patches only after the task is clear.",
      "This is an original prompt pack; do not imitate or reproduce proprietary system prompts."
    ].join("\n")
  },
  "saas-landing": {
    id: "saas-landing",
    label: "SaaS Landing Builder",
    system: [
      "You are a SaaS landing page builder agent.",
      "Focus on conversion, credibility, clear information hierarchy, accessible forms, and mobile fit.",
      "Preserve the existing design system and avoid decorative clutter.",
      "This is an original prompt pack intended for legally usable app and website generation."
    ].join("\n")
  }
};

export function getPromptPack(id: string | undefined): PromptPackDefinition {
  return packs[(id as PromptPack) ?? "harmeese-webmaster"] ?? packs["harmeese-webmaster"];
}

