# Forms Specification – Web Application Version 1.00

## Form Layout
- **Grid:** Two-column layout on desktop (`grid-template-columns: repeat(2,minmax(0,1fr))` with `gap: 32px`), collapses to single column below 1024px.
- **Section Blocks:** Each group enclosed in `FormSectionCard` (padding 32px, radius 24px). Section header uses `heading-sm` and optional helper text 14px.
- **Progress Indicators:** Multi-step forms display progress bar height 6px, corner radius 9999px; steps labelled with icon chips 36px.

## Input Styles
| Type | Height | Border | Background | Text |
| --- | --- | --- | --- | --- |
| Text/Email | 56px | 1px solid `#CBD5F5` | `rgba(255,255,255,0.92)` | `#0B1B3F` |
| Textarea | Min 144px | 1px solid `#CBD5F5` | Same | `#0B1B3F` |
| Select | 56px | 1px solid `#CBD5F5` with chevron icon | Same | `#0B1B3F` |
| Date Picker | 56px | 1px solid `#CBD5F5`, calendar icon 20px | Same | `#0B1B3F` |
| Toggle | Track 48×24px `#DBEAFE`, handle 20px | — | — |

- Focus state: border `#2563EB`, box-shadow `0 0 0 4px rgba(37,99,235,0.12)`.
- Error state: border `#EF4444`, helper text `#B91C1C`, icon `Heroicons ExclamationCircle` 20px.

## Labels & Helpers
- Labels 14px, weight 500, `margin-bottom: 8px`.
- Helper text sits 6px below input, 12px `#475569`. Validation messages replace helper text.

## Field Groupings
- Combine related fields (e.g., Name + Surname) into horizontal stack with `gap: 24px`.
- Use `fieldset` + `legend` for option groups (radio, checkbox). Legend uses `heading-xs`.

## Advanced Controls
- **Skill Tags Input:** Pill tokens with remove icon; input expands using flex wrap. Provide suggestions dropdown with `max-height: 240px`, `overflow-y: auto`.
- **File Upload:** Drag-and-drop area 320px height, dashed border `#94A3B8`, background `rgba(148,163,184,0.08)`. Provide icon 48px, instructions text 16px.
- **Stepper Controls:** For multi-step registration, `StepNavigator` component with `Next`, `Back`, `Save draft` options; `Save draft` uses tertiary button.

## Accessibility
- Each input associated with label via `id`/`for` attributes. Provide `aria-describedby` linking helper/validation text.
- Error summary at top of form listing anchors to fields for screen readers.
- `required` fields indicated with `*` plus `aria-required="true"`.

## Data Privacy Callouts
- Add `PrivacyNoticeBanner` (background `#E0F2FE`, icon 24px) before submission button on forms that collect personal data.
- Provide link to Terms and Data Policy; open in new tab with explicit notice.

## Submit Actions
- Primary button anchored bottom within sticky footer on long forms (height 72px). Provide `shadow-medium` and gradient background.
- Autosave occurs every 30s; show toast "Draft saved".

## Implementation Notes
- Use React Hook Form with Zod validation; map error states to design tokens above.
- Multi-step forms persist data via `localStorage` using key `gigvora.web.v1.form.<formName>`.

## Launchpad Talent Application Form
- **Sections:**
  1. Profile confirmation (read-only summary card pulling name, headline, portfolio link with "Edit profile" shortcut).
  2. Track focus (multi-select of Launchpad tracks, preference ordering via drag handle, mandatory minimum 1 selection).
  3. Experience depth (skill proficiency sliders 0–5 mapped to backend scoring weights, certification upload drop-zone with compliance banner when missing).
  4. Availability & logistics (weekly availability slider, timezone select, remote/on-site toggle, relocation willingness radio group).
  5. Compliance & consent (checkbox set for terms, GDPR storage consent, programme code of conduct, optional marketing opt-in).
- **Validation Rules:** Experience years must be ≥1 for fast-track eligibility; availability slider cannot be <10 hours; at least one certification or portfolio URL required for specific tracks (engineering, design) flagged by backend configuration; consent checkboxes blocking submission until toggled.
- **Submission Feedback:** Display inline summary card with assigned readiness score, next-step timeline ("Mentor interview within 5 days"), and CTA to view Launchpad dashboard. Refresh insights via React Query `invalidateQueries('launchpad-dashboard')`.

## Launchpad Employer Request Form
- **Sections:**
  1. Company overview (organisation name, sector dropdown, website, compliance contact, GDPR/IR35 acknowledgement).
  2. Opportunity brief (role title, track alignment chips, summary textarea with 600 character counter, success criteria bullet list input).
  3. Requirements matrix (skills checklist, minimum experience, engagement type toggle, location/remote fields with multi-select, security clearance radio group).
  4. Budget & timeline (currency select + min/max numeric inputs, contract length slider, start date picker, urgency tag radio group).
  5. Additional context (file upload for job spec PDF, notes for internal stakeholders, checkbox to request talent marketing feature).
- **Validation Rules:** Budget min must be < max; timeline slider cannot be empty; at least one skill selected; compliance acknowledgement mandatory; attachments limited to PDF/DOCX ≤5MB with client-side validation.
- **Post-submit Behaviour:** Success toast summarises SLA ("Talent partnerships will respond within 1 business day"), dashboard table scrolls to new row with status `Received`, and insights cards animate deltas. Provide "Share more context" CTA linking to CRM form with prefilled request ID.
