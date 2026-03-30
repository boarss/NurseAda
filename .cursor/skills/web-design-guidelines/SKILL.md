---
name: web-design-guidelines
description: >
  Quality bar for NurseAda web: accessibility, structure, performance, and i18n alignment. Use
  when reviewing or building pages, auditing UX, or checking focus, contrast, and semantics; triggers
  on accessibility, a11y, Lighthouse, landmarks, or web best practices.
---

# Web design guidelines (NurseAda)

## Accessibility

- **Focus**: Every interactive control has a visible focus style (`focus:ring-2 focus:ring-primary`, offset where needed).
- **Contrast**: Text and interactive states meet WCAG AA where feasible; primary buttons use colors validated against white label text (see [taste-skill](../taste-skill/SKILL.md)).
- **Touch targets**: Minimum ~44px height for primary actions on touch-friendly layouts.
- **Images**: Meaningful `alt` text via `next-intl` (e.g. `meta.logoAlt`); decorative images `alt=""`.
- **Forms**: Associate labels with inputs (`htmlFor` / `id`); describe errors in text, not color alone.

## Structure

- Use semantic landmarks: `main`, `header`, `nav`, `footer` where appropriate.
- Heading order: one logical `h1` per view; do not skip levels for styling—fix with classes instead.

## Performance

- Use `next/image` for raster logos and photos with explicit dimensions; SVG from `public/` may use `unoptimized` where Next requires it.
- Avoid large client bundles for static content; prefer Server Components where the app architecture allows.

## Internationalization

- All user-visible strings through `useTranslations()` / `t()`; keys in [`packages/locales`](packages/locales) for `en`, `pcm`, `ha`, `yo`, `ig`.
- Keep drug names and clinical codes in English per project rules when applicable.

## Product-specific

- Health disclaimers and professional discourse: [nurseada-ux-engineer](../nurseada-ux-engineer/SKILL.md).
- Chat and trust: no dark patterns that hide guest vs signed-in limitations.
