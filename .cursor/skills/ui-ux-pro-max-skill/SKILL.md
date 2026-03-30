---
name: ui-ux-pro-max-skill
description: >
  Orchestrates which skills and rules apply for NurseAda UI/UX work: clinical copy, i18n, a11y,
  motion, and shadcn patterns. Use for multi-step UI tasks, new pages, or when the user asks for
  end-to-end UX improvements; triggers on UX review, page flow, or holistic UI.
---

# NurseAda UI/UX orchestration

## Pick the right guidance

| Concern | Use |
|--------|-----|
| Chat copy, disclaimers, trust | Project rules + [nurseada-ux-engineer](../nurseada-ux-engineer/SKILL.md) |
| Motion, loading, toasts, haptics | [nurseada-design-engineer](../nurseada-design-engineer/SKILL.md) + [ui-animation](../ui-animation/SKILL.md) |
| Brand color and type | [taste-skill](../taste-skill/SKILL.md) |
| Radix/shadcn components | [shadcn-ui](../shadcn-ui/SKILL.md) (after init) |
| A11y, landmarks, performance | [web-design-guidelines](../web-design-guidelines/SKILL.md) |

## New page checklist

1. **Strings**: `t("namespace.key")` only; add keys to `packages/locales/en.json` first, then `pcm`, `ha`, `yo`, `ig`.
2. **Auth**: Gate protected routes per existing auth patterns; no secrets in client bundles.
3. **Medical**: No clinical logic in page components—call gateway/API only.
4. **Focus**: Visible focus rings on interactive elements (`focus:ring-2 focus:ring-primary`).
5. **Loading / error**: Meaningful empty and error states; avoid silent failures.

## Scope

- Prefer iterative polish over large one-off redesigns unless requested.
- Keep mobile and web behavior aligned when both exist (same copy keys where possible).
