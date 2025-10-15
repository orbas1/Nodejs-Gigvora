# Button System Specification — Application v1.50

## Button Hierarchy
1. **Primary Button** — For main actions; solid fill using `action.primary`.
2. **Secondary Button** — For supporting actions; outlined style with `action.primary` border.
3. **Tertiary Button** — Text-only link style for low-emphasis actions.
4. **Destructive Button** — Highlight destructive actions with `color.state.error` fill.
5. **Ghost Button** — Transparent background for dense layouts.
6. **Floating Action Button (FAB)** — Circular button for quick-add actions on mobile.

## Dimensions & Spacing
- Default height 48px desktop, 44px mobile.
- Padding: 20px horizontal for primary/secondary, 16px for tertiary.
- Corner radius 12px (FAB 50%).
- Icon + text spacing 8px.

## States
- Rest, Hover, Active, Focus, Disabled, Loading.
- Hover lighten by 6%, active darken by 10%, focus outline 2px accent with 4px offset.
- Loading shows spinner aligned left with label; disable pointer events.

## Accessibility
- Minimum touch target 48x48px.
- Provide aria labels for icon-only buttons.
- Ensure contrast ratio ≥ 4.5:1 for button text and background.
- Keyboard navigation: Enter/Space triggers button, Tab order logical.

## Usage Guidelines
- One primary button per screen section to avoid competing calls to action.
- Place primary actions at end of flow or bottom-right for desktop, bottom for mobile.
- Use destructive variant for irreversible actions with confirmation prompts.
- Provide ghost or tertiary variants within dense card footers.
- Prometheus exporter runbook CTA uses secondary button style with inline download icon; on warning/error states upgrade to primary styling with amber focus ring to emphasise escalation.

## Icon Buttons
- Standard size 40px desktop, 36px mobile; use for actions like edit, delete, more.
- Maintain tooltip with descriptive text; accessible name required.
- Use consistent icon stroke (2px) and align within 8px padding.

## Implementation Notes
- Buttons implemented as design system components (`Button/Primary`, etc.).
- Props include `size`, `icon`, `loading`, `disabled`, `ariaLabel`.
- Provide CSS variables for background, border, text, and shadow per state.
- Document integration with analytics events for key actions (book, assign, save).

## Testing Checklist
- Verify responsive behaviour on different device widths.
- Test keyboard navigation and focus states.
- Ensure loading state prevents double submissions.
- Confirm translation expansion fits within button width.
