# Forms Strategy

## Design Principles
- Break lengthy forms into steps using steppers and progress indicators.
- Provide inline validation and helpful hints; avoid modal error dumps.
- Support autosave for multi-step processes.

## Key Forms
- **Onboarding:** Multi-step forms capturing identity, skills, company info. Use contextual tooltips explaining why data is needed.
- **Project Creation:** Sections for scope, budget, timelines, team, and escrow template selection. Summary screen before submission.
- **Job Posting:** Include screening questions, attachments, and schedule selection. Provide preview before publishing.
- **Support Ticket:** Category selection, description, attachments, urgency. Suggest knowledge base articles prior to submission.

## Input Patterns
- Use text fields with clear labels above input; placeholder only for examples.
- Toggle switches for binary choices, segmented controls for small sets.
- Date/time pickers default to user locale; allow manual entry for accessibility.

## Validation & Errors
- Real-time validation; highlight errors with red border and helper text.
- Summaries show outstanding fields; allow navigation back without losing progress.

## Accessibility
- Ensure form elements labelled for screen readers.
- Provide descriptive error messages and suggestions.
