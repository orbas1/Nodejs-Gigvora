# Web Form Specification — Version 1.50

## Form Use Cases
- Demo request forms (short and long variants)
- Newsletter subscription
- Contact sales drawer
- Trial signup modal
- Support contact form

## Structure Guidelines
- Single-column layout for marketing forms; multi-step wizards for longer flows (trial signup).
- Show trust indicators (privacy note, certifications) near submit button.
- Provide progress indicator for multi-step forms.

## Input Components
- Text fields, email fields, phone with masking, dropdowns, multi-select chips, text areas.
- Toggle checkboxes for opt-in preferences (marketing emails, SMS).
- File upload for RFP attachments (contact sales advanced form).

## Validation
- Inline validation on blur; summarise errors at top if multiple issues.
- Provide clear success/error states with descriptive messaging.
- Integrate spam protection (reCAPTCHA v3) and hidden honeypot fields.

## Accessibility
- Associate labels and inputs using `for` attributes.
- Provide aria descriptions for helper text and error messages.
- Ensure focus order logical and visible focus outlines.
- Support keyboard navigation for dropdowns and checkboxes.

## Performance & Analytics
- Debounce API calls for auto-complete fields.
- Track `form_started`, `form_completed`, `form_abandoned`, and field-specific error events.
- Monitor conversion funnels via analytics dashboards.

## Implementation Notes
- Forms implemented using shared components with theme tokens.
- Provide fallback for no-JS (basic form post) where feasible.
- Document required fields and API payload schema.
