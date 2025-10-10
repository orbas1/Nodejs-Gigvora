# Form System – Web Application v1.50

## Layout Patterns
- **Single-column forms:** Default for onboarding and simple settings; align labels above fields for mobile responsiveness.
- **Two-column forms:** Used in dashboards for financial details, organisation profile. Maintain 24px gutter and align helper text with baseline.
- **Stepper wizard:** Multi-step flows (gig creation, dispute submission) with persistent summary column showing progress and autosave.

## Field Types
- Text input, textarea with character counter, email, password with show/hide toggle and strength meter.
- Number input with increment controls and currency prefix.
- File upload supporting drag-and-drop, progress indicator, virus scan status.
- Toggle switches for binary settings with inline explanation.
- Tags input supporting suggestions and free text, capped at 10 items.

## Validation
- Real-time validation for required fields on blur; critical errors appear inline with red text and icon.
- Summary banner at top of form when submission fails, linking to offending fields.
- Provide accessible messages using `aria-live="polite"` and `aria-describedby` linking to helper text.

## Autosave & Drafts
- Draft indicator in header with timestamp; autosave every 30 seconds or when field loses focus.
- Draft conflicts surface modal to resolve (keep mine vs use latest) referencing audit log.

## Security & Compliance
- Mask personally identifiable information until hovered by authorized roles.
- Sensitive fields (payment accounts) require re-auth after 5 minutes idle.
- Provide explicit consent checkboxes for terms and marketing preferences.
