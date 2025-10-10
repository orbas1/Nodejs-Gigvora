# Settings Screen Specification

## Layout
- Header with title, search icon, and profile avatar.
- Summary cards for account health, payment status, and security status.
- Section list with icon, title, description, and status pill.
- Footer links to Help Centre, Legal documents, and Logout.

## Interactions
- Search opens modal to filter settings options.
- Tapping a section transitions to detail screen with breadcrumb for navigation back.
- Status pills update dynamically (e.g., “Action required”, “Verified”).
- Account health card links to Launchpad readiness, trust score, and compliance tasks.

## Accessibility
- Ensure all touch targets >= 48px.
- Provide focus outlines and descriptive semantics for screen readers.
- Supports dynamic text scaling with vertical scroll adjustments.

## Analytics
- Track section opens and completion of key settings tasks (enable MFA, add payment method).
