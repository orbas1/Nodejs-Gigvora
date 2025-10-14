# Layout Organisation & Component Positions — Application v1.50

## Grid System
- Desktop: 12-column grid, 1200px max width, 24px gutters, 32px margins.
- Tablet: 8-column grid, 16px gutters, 24px margins.
- Mobile: 4-column grid, 12px gutters, 16px margins.
- Use CSS Grid/Auto Layout with responsive breakpoints to maintain structure.

## Page Structure Guidelines
1. **Header Region**
   - Contains breadcrumbs or tab controls, action buttons, contextual help icon.
   - Sticky at top for dashboards and queue screens.
2. **Primary Content Area**
   - Divided into modules based on priority (KPI row, main workspace, secondary panels).
   - Ensure highest priority information appears top-left on desktop, top on mobile.
3. **Sidebar/Secondary Panels**
   - Right-hand column for alerts, insights, or contextual help on desktop; collapses into drawers on mobile.
4. **Footer/Action Bar**
   - Global actions (Save, Publish, Assign) anchored bottom on mobile for reachability.

## Component Positioning
- **KPI Tiles:** Row at top of dashboards; limit to four per row.
- **Filters:** Located above tables/lists; include summary chips showing active filters.
- **Tables:** Occupy primary content area; align actions on right-hand side.
- **Drawers:** Slide from right with 480px width desktop, full-screen overlay mobile.
- **FAB/Quick Actions:** Lower right on desktop/tablet, bottom center on mobile.

## Responsiveness Patterns
- Collapse multi-column layouts into stacked sections on narrow screens.
- Convert side navigation into bottom sheet or hamburger menu on ≤1024px.
- Replace table rows with card layouts summarising key fields on mobile.

## Alignment & Spacing
- Follow 8pt baseline grid for vertical rhythm.
- Maintain consistent spacing between modules (32px desktop, 24px tablet, 16px mobile).
- Align form labels and inputs to grid lines for clean layout.

## Accessibility Considerations
- Preserve logical reading order when reflowing content.
- Keep focusable elements within view when action bars become sticky.
- Ensure content reflow does not hide essential information without alternate access.

## Implementation Notes
- Provide layout templates in design system (`Layout/Dashboard`, `Layout/Form`, `Layout/Detail`).
- Annotate breakpoints and behaviours in design specs for engineering reference.
- Validate prototypes across device simulators to confirm alignment and spacing.
