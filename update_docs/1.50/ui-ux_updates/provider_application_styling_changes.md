# Provider App – Styling Changes

## Colour System
- Adopted the platform-wide blue palette with provider-specific accent (Deep Indigo) for financial callouts and compliance warnings.
- Utilised neutral greys for dense data tables and dashboards, ensuring 4.5:1 contrast on key text.
- Success, warning, and error states re-toned to align with new semantic colour tokens.

## Typography
- Migrated to the shared font stack: **Manrope** for headings, **Inter** for body copy and data labels.
- Introduced condensed numerals for financial widgets and analytics cards to increase legibility within compact layouts.

## Components & Layout
- Dashboard cards now use 16px radii with layered shadows for depth, supported by motion easing when cards expand.
- Chips and filters adopt pill shapes with 12px padding to improve tap accuracy.
- Introduced responsive grid that collapses into single-column stacks under 360px width while preserving priority content.
- Pipeline snapshot widget combines stacked progress bars (submitted → shortlisted → interview → offer) with inline analytics badges referencing daily rollups.
- Workspace management modals feature stepped layouts with icon headers, inline validation, and audit copy blocks to reflect compliance requirements.
- Contact note composer adopts card layout with segmented visibility toggles and metadata callouts for author + timestamp.

## Iconography & Imagery
- Provider actions use duotone icons emphasising blue + neutral pairings; destructive actions gain a red accent fill.
- Illustrations in empty states have been updated to depict agency/team collaboration, aligning with refreshed brand story.

## Motion & Feedback
- Approvals and status changes trigger micro-animations (scale + fade) to confirm state transitions without being distracting.
- Toasts, banners, and modals share consistent entrance/exit timings (200ms ease-out, 150ms ease-in) for predictability.

## Accessibility & Compliance
- All primary buttons exceed 48px in height with minimum 16px internal padding.
- Forms support focus outlines and optional high-contrast mode with monochrome icon alternatives.
- Added support for dynamic text scaling up to 130% without layout breakage.
- Invitation lists expose row-level aria labels summarising invite status, expiry, and available actions for assistive technology support.
