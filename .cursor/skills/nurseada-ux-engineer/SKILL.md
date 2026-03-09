---
name: nurseada-ux-engineer
description: Designs and reviews NurseAda medical chatbot UX for clarity of advice, disclaimers, accessibility, and trust. Use when building or auditing chat UI, symptom flows, medication guidance, or health-related interfaces in NurseAda.
---

# NurseAda UX Engineer

## Purpose

Ensure NurseAda delivers medical consultations, recommendations, and diagnosis guidance in a clear, trustworthy, and accessible way. Users must understand severity, next steps, and limitations.

## Core Principles

1. **Medical advice must be visible and actionable** – Severity, recommendations, and codes should be easy to scan.
2. **Disclaimers are required but not intrusive** – Always present; visually separate from main content.
3. **Escalation paths are obvious** – Emergency, urgent, and routine care should be clearly distinguished.
4. **Empty state guides users** – Suggested prompts help users know what to ask.

## Chat UX Checklist

When building or reviewing chat:

- [ ] Suggested prompts on empty state (e.g. "I have a headache", "Can I take X with Y?")
- [ ] Loading indicator while waiting for response
- [ ] **Bold** and bullet lists rendered for triage output (severity, recommendations)
- [ ] Disclaimer visually separated (muted text, border-top)
- [ ] Error messages are actionable (e.g. "Gateway not found. Ensure the gateway is running.")
- [ ] Placeholder text is health-focused (e.g. "Describe your symptoms or ask a health question...")

## Backend Flow (Gateway Agents)

Medical logic flows through `services/gateway/app/agents/`:

- **Triage**: Symptom → severity, suggestions, inferred codes. Use CDSS when configured; fallback triage when not.
- **Medication**: Drug interactions, dosage. Requires medication terms.
- **General**: LLM + knowledge. When LLM unavailable, route symptom-like queries to triage.
- **Emergency**: Urgent escalation; always show clear emergency guidance.

## Intent and Code Check

- Expand intent patterns for natural queries: "I don't feel well", "feel bad", "help me", etc.
- Add symptom terms to code check: "unwell", "well", "feel", "nausea", "weak", "fatigue".
- Ensure users never get "not configured" when they describe symptoms – use fallback triage.

## Response Format

Triage responses should follow:

```
Based on your description, severity assessment: **{severity}**.
Confidence: {n}%.
My assessment: {reasoning}
Recommendations:
• {suggestion 1}
• {suggestion 2}
(Codes used for this assessment: ...)
```

## Disclaimer

Every clinical response must include:

> This is general information only, not medical advice. Consult a healthcare provider for your situation. In an emergency, seek care immediately.

## Accessibility

- Use semantic HTML (`role="alert"` for errors)
- Ensure sufficient color contrast (primary, error, muted)
- Support keyboard navigation (focus states on buttons, inputs)
- Provide `aria-label` for icon-only controls
