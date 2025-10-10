# Styling System – Web Application v1.50

## Spacing Scale (px)
`4, 8, 12, 16, 20, 24, 32, 40, 48, 64`
- Base spacing: 8px. Form fields use 16px vertical rhythm; cards adopt 24px outer margin on desktop, 16px on tablet, 12px on mobile.

## Corner Radius
- Buttons, chips, pill tags: 12px.
- Cards, modals, slide-overs: 16px.
- Input fields: 10px with inset shadow for focus states.

## Shadows & Elevation
- **Level 0:** none; used for neutral containers.
- **Level 1:** `0 2px 8px rgba(15, 34, 67, 0.08)` for cards and dropdowns.
- **Level 2:** `0 6px 24px rgba(15, 34, 67, 0.14)` for modals and floating panels.
- **Level 3:** `0 16px 32px rgba(15, 34, 67, 0.22)` reserved for system dialogs.

## Borders
- Default border: `1px solid var(--border-neutral)`.
- Focus border: `2px solid var(--accent-500)` with 2px offset to maintain visual balance.

## Motion
- Easing: `cubic-bezier(0.22, 0.61, 0.36, 1)`.
- Duration: 180ms for interface micro-interactions, 320ms for overlays.
- Reduce motion respects `prefers-reduced-motion`, swapping transitions for fades and immediate state changes.

## Responsive Rules
- Grid columns adapt 4/8/12 across `xs` to `lg` breakpoints.
- Typography auto scales using CSS clamp functions defined in `Fonts.md`.
- Navigation component transitions triggered at `md` for sidebar collapse and at `sm` for tab reconfiguration.

## Iconography
- Icon grid: 24px, stroke width 1.5px.
- Primary actions use duotone accent; secondary and tertiary maintain neutral outlines.

## Illustrations
- Home and empty states use soft gradient backgrounds (#0C2B5C → #3F7FE3) with 16px padded container, ensuring crisp display on retina.
