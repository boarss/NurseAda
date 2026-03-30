---
name: taste-skill
description: >
  Defines NurseAda brand taste—teal and mint contrast, medical trust with warmth, typography roles
  (display vs body), and alignment with CSS tokens. Use when choosing colors, type hierarchy, or
  visual tone for NurseAda web; triggers on brand, taste, palette, teal, logo, or visual identity.
---

# NurseAda brand taste

## Palette (logo-aligned)

- **Primary / brand surface**: deep teal (examples: `#0f766e`, `#0d9488`) for buttons, key accents, and the app mark background. Keeps WCAG contrast with **white** text on filled buttons (aim for roughly 4.5:1 for body-sized text on primary).
- **Supporting mint / ice**: very light mint or off-white mint (`#ecfdf5`, `#ccfbf1`) for icon strokes on teal or subtle highlights—not for long body text on white.
- **Warm neutrals**: keep page background and paper feel via existing `--bg` (`#faf8f5`) and `--surface` in [`apps/web/app/globals.css`](apps/web/app/globals.css); do not switch to cold grey-only clinic UI unless the product asks for it.

## Typography

- **Display / headlines**: `font-display` (Fraunces) for hero and major titles.
- **UI and body**: `font-body` (Source Sans 3) for navigation, forms, chat, and disclaimers.
- Avoid mixing a third display face unless specified.

## Consistency

- Map UI colors to **CSS variables** (`--primary`, `--primary-hover`, etc.) and Tailwind tokens (`bg-primary`, `text-muted`), not raw hex scattered in components.
- For motion and micro-interactions, see [ui-animation](../ui-animation/SKILL.md) and [nurseada-design-engineer](../nurseada-design-engineer/SKILL.md).

## Clinical product boundaries

- Brand is supportive, not alarming: reserve strong red/error tokens for real errors and warnings only.
- Medical logic stays in gateway agents per project rules—never encode triage in color alone.
