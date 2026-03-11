---
name: nurseada-design-engineer
description: >
  Applies design-engineer craft to NurseAda UI, animation, and UX. Use when building or refining
  interfaces, motion, micro-interactions, loading states, toasts, or haptics in NurseAda web or
  mobile. Triggers on "design engineer", "animation", "micro-interactions", "motion", "polish",
  "NurseAda UI", "chat UX", "accessibility", "toasts", "skeleton", "haptics".
---

# NurseAda Design Engineer

Apply design-engineer standards to NurseAda so every interaction feels intentional and every transition is consistent. This skill complements [nurseada-ux-engineer](.cursor/skills/nurseada-ux-engineer/SKILL.md) (disclaimers, clarity, trust) and project rules in `.cursor/rules/`.

## Motion

- **Tokens**: Use CSS variables in [apps/web/app/globals.css](apps/web/app/globals.css): `--duration-fast`, `--duration-normal`, `--duration-slow`, `--ease-out`, `--ease-spring`, `--ease-out-expo`, `--stagger-delay`. Extend Tailwind in [apps/web/tailwind.config.ts](apps/web/tailwind.config.ts) for `duration-fast`, `ease-out`, `ease-out-expo`, etc.
- **Prefer CSS**: Use CSS transitions and keyframes for hover, active, and enter/exit. Use a JS animation library only when CSS cannot achieve the effect (e.g. layout animations, spring physics).
- **Reduced motion**: All motion is disabled when the user prefers reduced motion via the block in `globals.css`. Do not add animations that bypass it.
- **Exit &lt; enter**: If you add explicit exit animations, make exit duration shorter than enter (e.g. 60–75% of enter).
- **Stagger**: When revealing lists (remedies, appointments), use `animation-delay: calc(var(--stagger-delay) * ${index})` so items do not all pop in at once (30–60ms per item).

## Buttons and Links

- **Immediate feedback**: Respond within one frame (16ms). Use `transition-transform duration-fast ease-out-expo` and `active:scale-[0.98]` (or mobile `pressed && { opacity: 0.85 }`).
- **Focus**: Always use `focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg` (or equivalent) so keyboard users see a clear focus state.
- **Touch targets**: Minimum 44px height/width for primary actions. Use `min-h-[44px]` or mobile `minHeight: 44`.

## Loading States

- **Lists**: Use skeleton placeholders (card-shaped blocks with `animate-pulse`) instead of only "Loading…" text so layout does not jump. Reserve space.
- **Chat**: Keep the three-dot or skeleton bubble indicator; ensure it uses motion tokens so it respects reduced-motion.
- **Auth**: Disabled submit button + "Signing in…" (or equivalent) is sufficient.

## Toasts (Web)

- **Library**: Sonner is mounted in [apps/web/app/layout.tsx](apps/web/app/layout.tsx). Use `toast.success()` and `toast.error()` from `sonner`.
- **When**: Success (reminder saved, appointment requested, interaction check done); errors (API failures, validation). Keep critical/blocking errors as inline alerts as well.
- **Copy**: Short and actionable. Use `t()` for all messages; keys live in `packages/locales/en.json` (e.g. `common.toastReminderSaved`).

## Mobile

- **Theme**: Use [apps/mobile/lib/theme.ts](apps/mobile/lib/theme.ts) for `colors`, `spacing`, and `radius`. Replace hardcoded hex so palette and spacing are consistent and single-source.
- **Press feedback**: Every primary action uses `Pressable` with `style={({ pressed }) => [baseStyle, pressed && { opacity: 0.85 }]}` (or equivalent) so users get immediate visual response.
- **Haptics**: Use [apps/mobile/lib/haptics.ts](apps/mobile/lib/haptics.ts). Trigger `hapticSuccess()` on confirmations (reminder saved, appointment requested, interaction check); `hapticWarning()` on destructive actions (delete, cancel). Guard with `isHapticsAvailable()`; do not overuse.

## Anti-patterns

- No linear easing for UI transitions; use custom curves or spring.
- No layout shift from loading; reserve space or use skeletons.
- No animation without a reduced-motion fallback (globals.css handles this globally).

## Accessibility

- **NurseAda UX**: Keep disclaimers, severity clarity, suggested prompts, and actionable error copy as in nurseada-ux-engineer and [.cursor/rules/nurseada-frontend-consistency.mdc](.cursor/rules/nurseada-frontend-consistency.mdc).
- **Contrast and semantics**: Sufficient color contrast; `role="alert"` for errors; `aria-label` for icon-only controls; keyboard-operable controls.

## Checklist for New UI Work

- [ ] Motion uses tokens and respects reduced-motion
- [ ] Buttons/links have focus ring and 44px target where appropriate
- [ ] Loading uses skeletons for lists where it makes sense
- [ ] Success/error feedback uses toasts (web) or haptics (mobile) where specified
- [ ] Mobile screens use theme and Pressable feedback
- [ ] No new user-facing strings without i18n keys
