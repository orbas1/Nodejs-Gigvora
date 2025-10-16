# Dashboard Settings Overview — Web Application v1.50

## Purpose
Allow users to customise dashboard layout, module visibility, and notification preferences while maintaining guardrails for critical information.

## Features
- **Module Visibility:** Toggle modules on/off with mandatory modules locked.
- **Layout Ordering:** Drag-and-drop modules within allowed regions; revert option to default order.
- **Density Settings:** Choose between comfortable and compact spacing.
- **Notifications:** Enable alerts for SLA breaches, new leads, payout status.
- **Theme Options:** Light/dark switch (future), accent colour selection.

## UX Considerations
- Provide preview of changes before saving.
- Display warning when hiding modules containing compliance-critical info.
- Ensure settings accessible via gear icon on dashboard header.

## Accessibility
- Drag-and-drop complemented with keyboard controls (move up/down buttons).
- Provide focus outlines and ARIA announcements when modules reordered.
- Consent history timeline expansion buttons announce state change and actor metadata; outstanding required badges include ARIA labels summarising pending policies for screen readers.

## Analytics
- Track adoption of custom layouts and re-enabled modules to inform default improvements.
