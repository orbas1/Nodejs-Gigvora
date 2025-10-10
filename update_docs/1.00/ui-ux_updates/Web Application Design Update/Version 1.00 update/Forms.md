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
