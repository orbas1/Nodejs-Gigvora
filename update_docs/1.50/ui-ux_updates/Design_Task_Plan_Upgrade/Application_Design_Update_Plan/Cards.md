# Card Component Specification — Application v1.50

## Purpose
Standardise card layouts across dashboards, lists, and detail surfaces ensuring consistency, readability, and actionable insights.

## Card Types
1. **Metric Card** — Highlights KPIs with trend indicators and actions.
2. **Gig Summary Card** — Displays gig details, status, and quick actions.
3. **Provider Profile Card** — Showcases provider rating, skills, availability.
4. **Task Card** — Lists tasks with due date, owner, and status.
5. **Announcement Card** — Communicates updates, warnings, or tips.

## Anatomy
- **Header:** Title, icon badge, optional status chip.
- **Body:** Primary content (metrics, description, list items) with aligned typography.
- **Meta Section:** Secondary info such as tags, location, timestamps.
- **Actions:** Buttons, quick action icons, or menus aligned bottom-right.

## Layout & Spacing
- Padding 24px (desktop), 16px (mobile).
- Grid alignment on 8px spacing increments.
- Height flexible but maintain minimum 180px for readability.
- Support horizontal vs. vertical orientation depending on container.

## Visual Design
- Border radius 18px, drop shadow `0 24px 48px rgba(15,23,42,0.08)`.
- Background default `surface.base`, hover `surface.raised`, selected `surface.alt`.
- Use accent colour for highlights and status chips; ensure contrast compliance.

## States
- Default, Hover, Focus, Active, Loading, Empty, Error, Disabled.
- Loading uses skeleton placeholders matching layout.
- Error state displays message with retry button.

## Interaction Guidelines
- Entire card clickable when representing navigation; otherwise restrict to explicit buttons.
- Provide keyboard focus outline (3px, accent colour) and allow activation via Enter/Space.
- Quick action icons accessible via tooltip and keyboard shortcuts.

## Content Guidelines
- Titles limited to 60 characters; truncate with ellipsis and tooltip for longer text.
- Use bullet lists for multi-line content, icons for quick scanning.
- Ensure copy tone matches brand (supportive, action-oriented).

## Responsiveness
- Cards stack vertically on mobile with consistent spacing.
- On tablet, display two-column layout; on desktop, up to four columns depending on container width.
- Maintain readability by adjusting typography scale via responsive tokens.

## Implementation Notes
- Component in design system named `Card/Base` with variants `Metric`, `Gig`, `Provider`, `Task`, `Announcement`.
- Provide props for `title`, `subtitle`, `meta`, `actions`, `status`, `icon`.
- Document integration with analytics events for card interactions.

## QA Checklist
- Verify alignment with design tokens (spacing, colours, typography).
- Test card states across hover, focus, keyboard navigation.
- Confirm responsiveness across breakpoints.
- Validate accessibility including screen reader labels and focus order.
