import type { Boilerplate } from "./types.js";

export interface BoilerplateDefinition {
  id: Boilerplate;
  label: string;
  category: "business" | "personal" | "creator" | "community";
  description: string;
}

export const boilerplateDefinitions: BoilerplateDefinition[] = [
  {
    id: "ai-training-company",
    label: "AI Training Company Website",
    category: "business",
    description: "Corporate AI workshops with lead capture and course cards."
  },
  {
    id: "saas-landing-page",
    label: "SaaS Landing Page",
    category: "business",
    description: "Product positioning, feature grid, proof points, and demo request form."
  },
  {
    id: "course-platform",
    label: "Course Platform",
    category: "business",
    description: "Course catalog, learning outcomes, cohort CTA, and enrollment lead form."
  },
  {
    id: "personal-portfolio",
    label: "Personal Portfolio",
    category: "personal",
    description: "Professional bio, selected work, services, writing, and contact form."
  },
  {
    id: "creator-link-in-bio",
    label: "Creator Link-in-Bio",
    category: "creator",
    description: "Creator profile, featured links, newsletter CTA, and sponsor inquiry form."
  },
  {
    id: "consultant-website",
    label: "Consultant Website",
    category: "personal",
    description: "Independent expert positioning, services, case studies, and booking CTA."
  },
  {
    id: "local-service-business",
    label: "Local Service Business",
    category: "business",
    description: "Local services, service area, reviews, and quote request form."
  },
  {
    id: "event-speaker-page",
    label: "Event Speaker Page",
    category: "personal",
    description: "Speaker bio, topics, testimonials, media kit, and booking inquiry form."
  },
  {
    id: "nonprofit-campaign",
    label: "Nonprofit Campaign",
    category: "community",
    description: "Mission story, impact stats, volunteer CTA, and supporter inquiry form."
  }
];

export const boilerplateIds = boilerplateDefinitions.map((definition) => definition.id);

export function isBoilerplate(value: unknown): value is Boilerplate {
  return typeof value === "string" && boilerplateIds.includes(value as Boilerplate);
}

export function getBoilerplateDefinition(id: Boilerplate): BoilerplateDefinition {
  return boilerplateDefinitions.find((definition) => definition.id === id) ?? boilerplateDefinitions[0];
}
