# Product Spec: AI Training Company Website

## Goal

Create a modern lead-generation website for a corporate AI training company. The site should make it easy for operations, HR, finance, sales, marketing, and engineering leaders to request a workshop.

## Audience

- Department leaders evaluating practical AI training.
- Enablement and L&D teams planning team-wide adoption.
- Technical leaders interested in agentic AI for engineering workflows.

## Core Pages

- Landing page with a clear hero and CTA.
- Content sections appropriate to the selected boilerplate.
- Why choose us / proof section focused on practical outcomes.
- Lead/contact form that captures name, company, email, team size or context, interest, and message.

Supported boilerplates include:

- AI training company
- SaaS landing page
- Course platform
- Personal portfolio
- Creator link-in-bio
- Consultant website
- Local service business
- Event speaker page
- Nonprofit campaign

## Lead Workflow

When a visitor submits the lead form:

1. Save the lead locally.
2. Route the submission through the AI backend.
3. Have the AI backend summarize, prioritize, draft a reply, and queue safe automation hooks.
4. Use Maton hooks, when explicitly enabled, to create Gmail drafts and Calendar follow-up holds.
5. Notify the configured Telegram chat with the lead, AI handling plan, and action hook results.
6. Include suggested reply actions: draft reply, summarize, create proposal, update site.

The website backend is intentionally AI-first. Forms and interactions should call AI handling hooks instead of requiring a hand-coded business workflow for every interaction.

External side effects are guarded. Calendar and mail hooks are queued locally by default and only call Maton when explicit environment flags are enabled.

## Availability Contract

- A Telegram `/change` request must never directly restart, overwrite, or take down the live website.
- Change requests are staged in `specs/tasks.md` and `agent_runs/`.
- Deployment is a separate action and must use health checks or a blue/green-style handoff before traffic moves.
- If the AI backend is unavailable, forms must still save locally and notify/log a fallback handling plan.

## Success Criteria

- Visitor understands the training offer within the first viewport.
- Lead form works on desktop and mobile.
- Telegram notification is sent when credentials exist and logged when they do not.
- AI backend handling produces a lead summary, priority, draft reply, and automation hooks.
- The live website stays available while Telegram changes are queued.
