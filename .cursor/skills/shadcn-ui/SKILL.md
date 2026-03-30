---
name: shadcn-ui
description: >
  Guides adding and using shadcn/ui in NurseAda: init, theming to existing CSS variables, preferred
  primitives, and keeping clinical logic out of UI. Use when adding shadcn components, registry
  setup, or Radix-based patterns; triggers on shadcn, radix, or Button Card Dialog from shadcn.
---

# NurseAda + shadcn/ui

## Prerequisites

- shadcn is **optional** in this repo. Initialize only when you need shared primitives:
  - From `apps/web`: `npx shadcn@latest init` (choose Tailwind, defaults aligned with existing `tailwind.config.ts`).
  - Do not duplicate NurseAda-specific tokens—**map** shadcn theme to existing CSS variables in `globals.css` (`--primary`, `--radius`, `--border`, etc.).

## Theming

- After init, set `components.json` **style** and **baseColor** to complement teal primary; override component CSS variables in `globals.css` or the generated `app/globals.css` layer so `bg-primary` matches `--primary`.
- Prefer **one** source of truth: NurseAda semantic tokens (`primary`, `surface`, `muted`) over raw Tailwind default palette.

## Preferred primitives

- **Button**, **Card**, **Dialog**, **Dropdown menu**, **Sheet** (mobile-friendly panels)—add only what a feature needs (`npx shadcn@latest add button`).
- Compose with **next-intl** for labels; never hardcode strings.

## Boundaries

- **No** triage, diagnosis, or medication rules inside UI components—gateway agents only.
- Forms that touch health data still require disclaimers and existing API contracts.

## Reference

- Official patterns: Vercel shadcn docs (CLI, theming).
- Motion: keep using CSS tokens from [ui-animation](../ui-animation/SKILL.md).
