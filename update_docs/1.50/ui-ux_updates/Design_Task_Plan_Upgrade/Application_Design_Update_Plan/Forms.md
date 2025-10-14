# Form Design Specification — Application v1.50

## Goals
- Deliver forms that are efficient, accessible, and resilient to error conditions across provider and consumer workflows.
- Standardise interaction patterns, validation messaging, and component usage.

## Form Types Covered
1. Onboarding forms (provider verification, compliance)
2. Gig creation and editing forms
3. Scheduling and availability forms
4. Financial and payout setup forms
5. Settings and preference forms
6. Support/report issue forms

## Structure Guidelines
- Use single-column layout for mobile, dual-column for desktop when field relationships permit.
- Group related fields within section cards with clear headings and optional descriptions.
- Provide progress indicators for multi-step forms; include save/exit options.

## Validation & Feedback
- Apply real-time validation on blur; critical checks occur on submit.
- Display error message beneath field with icon and plain language.
- Highlight invalid fields with red border (`color.state.error`) and maintain focus order for accessibility.
- Provide success confirmation (inline checkmark or toast) when forms save successfully.

## Input Components
- Text fields with label, placeholder, helper text, character counter when necessary.
- Dropdowns with search capability and keyboard navigation.
- Toggle switches for binary options; radio buttons for mutually exclusive selections.
- Date/time pickers supporting timezone awareness, recurring patterns.
- File upload components with drag/drop, preview thumbnails, and progress bars.

## Accessibility Considerations
- Ensure labels associated with inputs using `for` and `id` attributes.
- Provide descriptive aria labels for icons and toggles.
- Support keyboard navigation (tab order, space/enter interactions).
- Include instructions for required vs. optional fields.

## Error Handling Scenarios
- Network failure: display persistent banner with retry option and preserve entered data.
- Permission denial: show contextual message and guidance to request access.
- API validation errors: map backend responses to user-friendly messages.

## Copy Guidelines
- Use action-oriented, concise field labels.
- Provide helper text to clarify requirements (e.g., "Minimum 50 characters explaining the service").
- Offer inline tips for sensitive information handling (privacy, compliance).

## Testing Checklist
- Validate forms with screen readers (VoiceOver, TalkBack).
- Test with varied input lengths, special characters, international formats.
- Ensure autosave functions across connection disruptions.
- Confirm analytics events capture form start, completion, and abandon events.

## Implementation Notes
- Forms managed via shared component library with consistent props.
- Use form state management (React Hook Form, Formik) with centralised validation schemas.
- Provide design tokens for spacing, typography, and colours to engineering for implementation.
