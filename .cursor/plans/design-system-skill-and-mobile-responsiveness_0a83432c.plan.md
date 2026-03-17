---
name: design-system-skill-and-mobile-responsiveness
overview: Create a reusable design-system-engineer skill for Cursor and define a stepwise plan to make the NurseAda web app fully responsive on mobile using shared layout primitives and Tailwind.
todos:
  - id: author-skill-file
    content: Author `~/.cursor/skills/design-system-engineer/SKILL.md` with name, description, and instructions for responsive, design-system-focused work in React/Next.js + Tailwind.
    status: completed
  - id: audit-layout
    content: Audit key layout files (`layout.tsx`, main pages, shared components, Tailwind config) for non-responsive patterns and list concrete problem spots.
    status: completed
  - id: tailwind-tokens-breakpoints
    content: Adjust or confirm Tailwind breakpoints and design tokens to support mobile-first design.
    status: completed
  - id: add-layout-primitives
    content: Define or standardize layout primitives (page container, section header, card) and refactor core pages to use them.
    status: completed
  - id: mobile-first-pages
    content: Make home, chat, remedies, medications, appointments, patient, and admin clinics pages mobile-first and verify behavior at common viewport widths.
    status: completed
isProject: false
---

### Goal

Create a `design-system-engineer` Cursor skill that encodes how to evolve NurseAda’s web design system, then apply it to make the web app responsive across mobile devices by fixing global layout primitives and key screens.

### 1. Create the `design-system-engineer` skill (personal)

- **Skill location**: `~/.cursor/skills/design-system-engineer/` with a `SKILL.md` file as the entry point.
- **Frontmatter**:
  - `name`: `design-system-engineer`
  - `description`: Clearly state that it improves and maintains design systems, responsive layouts, and component primitives for React/Next.js + Tailwind projects; mention trigger terms like "design system", "responsive", "breakpoints", "layout primitives", "tokens".
- **Skill body sections**:
  - **Context & stack**: Briefly note NurseAda uses Next.js 16, Tailwind, `apps/web/app/layout.tsx`, shared components in `apps/web/components/`, and Tailwind config in `apps/web/tailwind.config.ts`.
  - **Design tokens & primitives**: Instructions to standardize spacing, typography, colors, radii, and breakpoints via Tailwind theme, and to favor responsive utility classes over ad‑hoc CSS.
  - **Layout guidelines**: Mobile‑first, max‑width containers, consistent horizontal padding, and safe areas for notches. Encourage using patterns like `max-w-4xl mx-auto px-4 sm:px-6` on main content.
  - **Component patterns**: How to build responsive cards, headers, forms, and tab layouts using Tailwind (`grid`, `flex`, `gap`, `md:` / `lg:` prefixes) with NurseAda’s tone.
  - **Interaction & accessibility**: Guidance for focus states, tap targets, and line lengths on small screens.
  - **Workflow**: Stepwise checklist for applying the skill: audit → design tokens → primitives → page layouts → QA on breakpoints.
- **Optional extras**: Add an `examples.md` showing before/after responsive refactors for a card grid and a form layout.

### 2. Audit current web layout & breakpoints (read-only)

- **Files to review**:
  - Layout and providers: `[apps/web/app/layout.tsx](apps/web/app/layout.tsx)`, `IntlProvider`, `AuthContext` to see global wrappers.
  - Key pages: `[apps/web/app/page.tsx](apps/web/app/page.tsx)`, `[apps/web/app/chat/page.tsx](apps/web/app/chat/page.tsx)`, `[apps/web/app/remedies/page.tsx](apps/web/app/remedies/page.tsx)`, `[apps/web/app/medications/page.tsx](apps/web/app/medications/page.tsx)`, `[apps/web/app/appointments/page.tsx](apps/web/app/appointments/page.tsx)`, `[apps/web/app/patient/[id]/page.tsx](apps/web/app/patient/[id]/page.tsx)`, `[apps/web/app/admin/clinics/page.tsx](apps/web/app/admin/clinics/page.tsx)`.
  - Shared UI: `[apps/web/components](apps/web/components)` (nav, buttons, cards, language picker, chat input) and `[apps/web/tailwind.config.ts](apps/web/tailwind.config.ts)`.
- **Audit focus**:
  - Hard‑coded widths/heights, large fixed paddings/margins, or flex/grid layouts that don’t wrap on narrow viewports.
  - Elements that assume desktop (e.g. side‑by‑side columns) without mobile stacking.
  - Any custom CSS (if present) that overrides Tailwind in a non‑responsive way.
- **Deliverable**: A short internal checklist of specific components/pages that break on small screens (e.g. chat header overflows, cards too wide, forms clipped).

### 3. Strengthen Tailwind breakpoints and design tokens

- **Tailwind config** (`apps/web/tailwind.config.ts`):
  - Verify standard breakpoints (`sm`, `md`, `lg`, `xl`) and extend only if needed for specific devices (e.g. `xs` ~360px) without overcomplicating.
  - Ensure font sizes, spacing scale, and `borderRadius` tokens align with the intended design system.
- **Global styles**:
  - Confirm base typography and background/foreground colors work on both light/dark backgrounds and on small screens (no unreadable low‑contrast text).
  - Encourage using relative units (rem) via Tailwind utilities rather than raw px in custom CSS.

### 4. Introduce/standardize layout primitives

- **Main shell**:
  - In `layout.tsx`, wrap main content in a responsive container like `max-w-5xl mx-auto px-4 sm:px-6` and ensure `min-h-screen` with appropriate background.
- **Reusable primitives** (using existing components or adding new ones if they exist in repo patterns):
  - A `PageShell` or similar wrapper: sets page max‑width, vertical padding, and handles mobile top padding so content doesn’t clash with fixed headers.
  - A `SectionHeader` pattern for page titles/subtitles with responsive text sizes and spacing.
  - A `Card` or `Surface` pattern with consistent padding and rounded corners that scales down nicely on mobile.
- **Refactor strategy**:
  - Start by applying these primitives to the most critical flows: home + chat, then remedies/medications/appointments, then patient/admin pages.

### 5. Make top‑level navigation and header responsive

- **Header / nav component** (in `apps/web/components`):
  - Ensure logo + nav links + language picker fit on narrow screens; likely switch to a stacked or hamburger-style layout under `sm`.
  - Ensure `LanguagePicker` doesn’t overflow; constrain width and allow it to wrap or use a dropdown that fits on small screens.
- **Behavior**:
  - Verify sticky headers don’t steal too much vertical space on small devices, or adjust behavior (e.g. non‑sticky on very small heights).

### 6. Make key pages mobile-first

For each page, apply mobile‑first Tailwind classes, stacking content vertically on small screens and fanning out on larger ones.

- **Home (`app/page.tsx`)**:
  - Ensure hero text wraps gracefully and CTAs stack on narrow screens.
  - Ensure feature sections/cards use `grid` or `flex` that goes single‑column on `sm` and two‑column on `md+`.
- **Chat (`app/chat/page.tsx`)**:
  - Chat header: keep nav chips (Remedies/Medications/Appointments) and language picker from overflowing; stack into multiple rows on `sm`.
  - Message list: ensure it scrolls within viewport height on small screens without content hidden behind fixed input.
  - Input bar: use a mobile‑friendly layout where the textarea and send button are full‑width, with attach buttons accessible and not tiny.
- **Remedies / Medications / Appointments pages**:
  - Card lists: use responsive grid (`grid-cols-1 sm:grid-cols-2` etc.) and ensure badges and meta info wrap instead of overflowing.
  - Tabs: ensure tab labels wrap or scroll horizontally rather than clipping, and maintain large enough tap targets.
  - Forms (medication reminders, appointment booking): use single‑column forms on mobile with full‑width inputs and buttons, generous vertical spacing.
- **Patient profile & Admin clinics**:
  - Patient page tabs and tables/cards should stack on mobile; avoid wide table layouts that force horizontal scrolling unless absolutely necessary.
  - Admin clinics cards already use a card layout; ensure spacing and labels look correct on small widths.

### 7. Quick responsive QA strategy

- **Local testing**:
  - Run `npm run dev:web` and use browser devtools to test at common widths (e.g. 320px, 375px, 414px, 768px).
  - For each main route, verify: no horizontal scrolling, text not clipped, primary actions visible without awkward scrolling.
- **Automated smoke tests (optional)**:
  - Extend existing Playwright/Vitest tests (if present in `apps/web/e2e`) with single mobile‑viewport runs that at least assert pages render and have no client‑side errors.

### 8. Future improvements governed by the skill

- When future UI work is requested:
  - Apply the `design-system-engineer` skill: start from tokens and primitives, then adjust individual components.
  - Keep new components mobile‑first by default and rely on the Tailwind breakpoints defined earlier.
  - Update the skill’s `examples.md` when new patterns emerge, so it remains aligned with the actual codebase.

