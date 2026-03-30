---
name: ui-animation
description: >
  Motion contract for NurseAda web: CSS duration/easing tokens, reduced-motion policy, stagger and
  chat patterns. Use when adding transitions, hover states, or entrance animations; triggers on
  animation, motion, transition, micro-interactions, or stagger.
---

# UI animation (NurseAda web)

## Tokens

Use variables from [`apps/web/app/globals.css`](apps/web/app/globals.css):

- Durations: `--duration-fast`, `--duration-normal`, `--duration-slow`
- Easing: `--ease-out`, `--ease-spring`, `--ease-out-expo`
- Stagger: `--stagger-delay` for list reveals

Tailwind extensions in [`apps/web/tailwind.config.ts`](apps/web/tailwind.config.ts) expose `duration-fast`, `ease-out-expo`, etc.

## Rules

- **Prefer CSS** transitions and keyframes over JS animation libraries unless layout animation requires it.
- **Reduced motion**: The `@media (prefers-reduced-motion: reduce)` block in `globals.css` forces minimal animation duration—do not bypass with `!important` on motion-heavy classes.
- **Buttons / links**: `transition-transform duration-fast ease-out-expo` and `active:scale-[0.98]` for tactile feedback (see [nurseada-design-engineer](../nurseada-design-engineer/SKILL.md)).

## Chat and lists

- Message bubbles: use existing `animate-bubble` / enter patterns where present; keep enter slightly longer than exit if both exist.
- Suggested prompts and remedy grids: stagger with `animation-delay: calc(var(--stagger-delay) * index)`.

## Brand

- Motion should feel calm and clinical-adjacent—avoid flashy bounces except subtle `ease-spring` on small controls.
