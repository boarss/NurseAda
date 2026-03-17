---
name: design-system-engineer
description: Design and evolve responsive design systems, layout primitives, and UI components for React/Next.js + Tailwind projects. Use when the user mentions design system, responsive layout, mobile polish, breakpoints, Tailwind tokens, or UI consistency.
---

# Design System Engineer

## Purpose

This skill guides the agent to act as a design system engineer for NurseAda-style projects:

- Maintain a coherent design system (tokens, layout primitives, component patterns).
- Make web UIs **mobile-first and responsive** across common breakpoints.
- Keep implementations aligned with React/Next.js + Tailwind best practices.

Although written for the NurseAda web app, the principles apply to any similar stack.

## Context & Stack

When this skill is used in the NurseAda project:

- **Framework**: Next.js 16 (App Router) with React 18.
- **Styling**: Tailwind CSS configured in `apps/web/tailwind.config.ts`.
- **Layout entry**: `apps/web/app/layout.tsx`.
- **Key pages**: `apps/web/app/page.tsx`, `apps/web/app/chat/page.tsx`, `apps/web/app/remedies/page.tsx`, `apps/web/app/medications/page.tsx`, `apps/web/app/appointments/page.tsx`, `apps/web/app/patient/[id]/page.tsx`, `apps/web/app/admin/clinics/page.tsx`.
- **Shared components**: `apps/web/components/*` (navigation, cards, language picker, forms, chat input, etc.).

Assume Tailwind is the primary styling tool. Prefer utilities and small abstractions over ad-hoc custom CSS.

## Design Tokens & Primitives

When adjusting the design system:

- **Colors**: Use semantic Tailwind tokens that map to CSS variables (e.g. `bg`, `fg`, `surface`, `border`, `primary`, `error`). Do not hardcode hex values inside components when a token exists.
- **Typography**:
  - Use `font-display` for headings and `font-body` for paragraph text.
  - Keep line lengths comfortable on mobile (roughly 45–75 characters) by constraining container width and using `leading-relaxed` or similar.
- **Spacing**:
  - Use Tailwind spacing scale (`px-4`, `py-6`, `gap-4`, etc.) instead of arbitrary `px` values.
  - Prefer vertical rhythm: consistent spacing between sections, cards, and form fields.
- **Radii & shadows**:
  - Use semantic radii like `rounded-card` and shadows like `shadow-card` that are defined in Tailwind’s `extend`.
- **Breakpoints**:
  - Treat **mobile as the default**; add modifiers like `sm:`, `md:`, `lg:` to progressively enhance layouts.
  - Typical breakpoints:
    - `sm` (~640px): small tablets / larger phones in landscape.
    - `md` (~768px): tablets.
    - `lg` (~1024px) and up: desktop.
  - Only introduce an extra-small `xs` breakpoint if there is a concrete need (e.g. very narrow phones at ~360px) and keep its usage minimal.

## Layout Guidelines

When shaping pages:

- **Use a responsive page container**:
  - Wrap primary content in a container such as `max-w-5xl mx-auto px-4 sm:px-6` and `min-h-screen`.
  - This keeps content readable on wide screens and adds safe horizontal padding on narrow ones.
- **Mobile-first columns**:
  - Use `flex` or `grid` that defaults to **single column** and adds multi-column layout at `md+`:
    - Example: `grid grid-cols-1 md:grid-cols-2 gap-4`.
    - Example: `flex flex-col gap-4 md:flex-row`.
- **Avoid fixed widths/heights**:
  - Do **not** use `w-[900px]` or `h-[600px]` for primary layout containers.
  - Use `w-full`, `max-w-*`, or intrinsic heights with padding and margins.
- **Handle safe areas and sticky elements**:
  - When headers or input bars are sticky, ensure the main content accounts for their height using padding or `pt-*` / `pb-*`.
  - On very small screens, consider disabling stickiness if it hides too much content.

## Component Patterns

When modifying or creating components:

- **Headers & page titles**:
  - Use a pattern like:
    - `mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between`.
  - Title text should scale gracefully: `text-xl sm:text-2xl` for headings, `text-sm text-muted` for subtitles.
- **Cards**:
  - Structure cards with `rounded-card border border-border bg-surface p-4 shadow-card` on container-level components.
  - Ensure content wraps (`flex-wrap`, `break-words`) instead of overflowing on small devices.
- **Forms**:
  - Use a **single column** on mobile: `space-y-4` between fields and `w-full` buttons.
  - Use `md:grid md:grid-cols-2 md:gap-4` only where side-by-side layout improves readability on tablets and desktops.
- **Tabs and navigation chips**:
  - Ensure tab labels remain readable and tappable:
    - Use `flex gap-2 overflow-x-auto` for chip-like navs.
    - Avoid shrinking labels below comfortable tap size.
- **Chat layout**:
  - Messages should live in a scrollable column (`flex flex-col gap-2 overflow-y-auto`) with padding.
  - Input area should be full-width, with clear separation from messages and no overlap.

## Interaction & Accessibility

Always:

- Maintain noticeable focus states (outline, ring) for keyboard users.
- Keep tap targets at least ~40x40px on mobile.
- Ensure contrast meets accessibility guidelines; when in doubt, use stronger text colors (`text-fg`) over muted ones.
- Avoid hover-only affordances for critical actions; mobile users may never see them.

## Workflow Checklist

When using this skill on a feature or page:

1. **Audit**
   - Identify hard-coded widths/heights, non-wrapping flex/grid layouts, and elements that assume desktop widths.
   - Note any content that overflows or requires horizontal scrolling on 320–414px viewports.
2. **Align tokens**
   - Ensure the necessary colors, typography, and spacing tokens exist in Tailwind.
   - Prefer semantic tokens to one-off values.
3. **Introduce or reuse layout primitives**
   - Use or add components like `PageShell`, `SectionHeader`, and `Card` where they simplify consistency.
4. **Refactor layout mobile-first**
   - Start from a single-column layout.
   - Add `sm:` / `md:` modifiers only where they clearly improve the larger-screen experience.
5. **Polish interactions**
   - Confirm primary actions are visible without awkward scrolling.
   - Ensure focus and active states are visible and accessible.
6. **QA across breakpoints**
   - Test at ~320px, 375px, 414px, 768px, and a desktop width.
   - Verify there is no horizontal scrolling, clipped text, or overlapping UI.

## Examples (Conceptual)

### Responsive card grid

Mobile-first card grid:

```tsx
<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
  {items.map((item) => (
    <article
      key={item.id}
      className="rounded-card border border-border bg-surface p-4 shadow-card"
    >
      {/* card content */}
    </article>
  ))}
</div>
```

### Page shell pattern

```tsx
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-bg">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </div>
    </main>
  );
}
```

Use these patterns to keep NurseAda’s web app looking and feeling consistent across all devices.

