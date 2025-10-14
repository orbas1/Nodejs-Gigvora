# Profile Styling Guidelines — Web Application v1.50

## Colour & Typography
- Use `web.surface.base` for cards with subtle shadows.
- Headings in Space Grotesk 24/32; body copy Inter 16/24.
- Status badges colour-coded (verified `#16A34A`, pending `#F59E0B`).

## Components
- Profile header card with background gradient, avatar, and primary actions (Edit, Invite).
- Metrics tiles with icons and trend indicators.
- Tab navigation for Overview, Activity, Settings.
- Activity list items with timeline dots and category labels.

## States
- Loading skeleton replicates layout with avatar placeholder.
- Empty state when no activity includes illustration and CTA to explore platform.
- Error state shows banner with retry button and contact support link.

## Accessibility
- Provide clear focus outlines for edit buttons and tabs.
- Ensure text contrast meets AA requirements.
- Provide keyboard shortcuts for editing sections where applicable.

## Implementation Notes
- Component names `Profile/HeaderCard`, `Profile/MetricTile`, `Profile/ActivityList` in design system.
- Analytics events track profile edits and tab views.
