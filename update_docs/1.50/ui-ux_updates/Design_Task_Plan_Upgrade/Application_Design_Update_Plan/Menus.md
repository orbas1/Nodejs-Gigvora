# Menu System Guidelines — Application v1.50

## Menu Types
1. **Primary Navigation Menu** — Left rail or top bar containing major sections.
2. **Contextual Action Menu** — Ellipsis/dropdown presenting item-specific actions.
3. **Mega Menu** — Desktop web marketing navigation with grouped links.
4. **Overflow Menu** — Mobile bottom sheet for additional actions.
5. **User Menu** — Profile avatar dropdown with account settings and logout.

## Design Specifications
- **Primary Navigation:** Icons + labels, collapsible sections, highlight active route with accent bar, support keyboard navigation.
- **Contextual Menus:** 4px radius, shadow `0 12px 32px rgba(15,23,42,0.12)`, item height 44px, hover/active background `#EEF2FF`.
- **Mega Menu:** 960px width, 24px padding, columns with headings and link lists, support descriptive text.
- **Overflow Menu:** Bottom sheet with drag handle, large touch targets (min 56px), actions grouped by priority.
- **User Menu:** Includes account status badge, quick links (Profile, Billing, Support, Logout), theming toggle.

## Interaction Patterns
- Menus open on click/tap; close on outside click, escape key, or selection.
- Maintain focus trap within open menus for accessibility.
- Support keyboard navigation (Up/Down arrows, Enter to select, Esc to close).
- Provide subtle open/close animations (120ms fade/slide).

## Content Guidelines
- Use concise, action-oriented labels.
- Group related actions with dividers and headings for clarity.
- Include icons for high-priority actions; ensure icon meaning is clear.
- Avoid nested menus beyond two levels to prevent complexity.

## Accessibility
- Menus have `role="menu"` and `role="menuitem"` assignments with appropriate aria attributes.
- Ensure focus indicators visible on each item.
- Provide aria-expanded state on triggers.
- For mobile, announce menu opening via screen reader hint.

## Implementation Notes
- Document menu variants in design system with consistent padding, typography, and icon alignment.
- Provide React component API including `items`, `onSelect`, `disabled`, `danger` properties.
- Support localisation with flexible width accommodating longer strings.

## Testing Checklist
- Verify keyboard navigation and focus management.
- Test menu positioning near viewport edges to prevent clipping.
- Ensure scrollable menus behave correctly with large item counts.
- Confirm menus close appropriately when new modal/drawer opens.
