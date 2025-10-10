# Functional Design – Web Application Version 1.00

## Navigation & Wayfinding
- **Global Header:** Sticky with background blur. Active link indicator moves via transform for performance. Includes quick action pill ("Post opportunity") visible to providers.
- **Secondary Nav:** On dashboard and marketplace, secondary tabs appear as chip toggles. Scroll horizontally on mobile with snap points.
- **Breadcrumbs:** Displayed on detail pages (Opportunity, Launchpad track, Resource articles) with `> ` separators and accessible nav semantics.

## State Management
- Use React Query for data fetching with caching TTL 5 minutes for feed, 15 minutes for resources. Optimistic updates on `Apply` action.
- Local storage persists theme preference, saved filters, collapsed dashboard panels.
- Context providers: `AuthContext`, `ThemeContext`, `NotificationContext` ensure cross-component state.

## Feedback & Notifications
- Toast notifications appear top-right; limit to 3 concurrent. Provide `undo` for actions (e.g., saved to favorites).
- Inline validation for forms with `onBlur` triggers. Summary banner at top for submission errors.
- Loading uses skeletons for cards and shimmering bars for metrics. Global loading bar (top 4px) for route transitions.

## Search & Filtering
- Search bar supports keyboard shortcuts: `/` focus input, `Esc` clears.
- Filters appear as chips + dropdowns; multi-select checkboxes open in `FilterDrawer` (width 360px). Drawer accessible with `aria-modal`.
- Results update with 200ms debounce; show `dataStatus` component (Last updated, Source, Refresh button).

## Collaboration & Engagement
- Feed posts support actions: like, comment, share. Comments expand inline with nested replies. Reaction icons animate scale `1 → 1.14` on click.
- Launchpad applications provide progress tracker with 5 steps, each linking to dedicated form sections.
- Profile endorsements triggered by `Endorse skill` button; opens modal with skill list and optional note.

## Security & Trust
- Sensitive actions (delete, archive) require confirmation modal with security copy. Provide fallback contact link.
- Session timeout prompts appear after 25 minutes idle; modal 480px width with countdown.
- Admin login includes inline security tips and `Remember device` toggle with explanation tooltip.

## Responsiveness & Device Support
- Layout adjusts at each breakpoint; ensures minimum touch target 44×44px on touch devices.
- Off-canvas menus slide from right with overlay; closing resets scroll lock.
- Data tables convert to stacked cards on mobile with label-value pairs.

## Accessibility
- All interactive elements accessible via keyboard. Provide skip link to main content.
- Use aria-live regions for asynchronous updates (e.g., when new feed posts load automatically).
- Provide language switcher with `aria-haspopup="listbox"` and highlight current selection.

## Analytics & Instrumentation
- Route views tracked via `web.v1.route.<name>` events with payload (userType, timestamp, experimentVariant).
- CTA interactions include context (componentId, pageSection). Data forwarded to Segment.
- A/B testing hook toggles hero layout (image left vs right). Documented fallback ensures consistent spacing.
