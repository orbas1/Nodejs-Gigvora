# Dashboard Organisation & Information Architecture – Web Application Version 1.00

## Primary Zones
1. **Overview Zone (Top Row)**
   - Contains welcome message with avatar, quick metrics, and action chips.
   - Height 112px; background `rgba(255,255,255,0.92)` with subtle border bottom.
2. **Execution Zone (Left Column)**
   - Houses `Tasks Queue`, `Launchpad Progress`, `Opportunities Snapshot` stacked vertically.
   - Spacing 24px between modules.
3. **Insight Zone (Right Column)**
   - Contains `Metric Overview`, `Notifications`, `Community Pulse`.
   - Right column width 360px.

## Information Priority
- Primary metrics (Revenue, Active opportunities, Conversion) at top for immediate insight.
- Tasks emphasised with bold titles and due date chips. Overdue tasks tinted `#FEE2E2` background.
- Notifications show severity icon (info, success, warning) using accent semantics.

## Navigation Integration
- Secondary nav tabs below header: `Overview`, `Opportunities`, `Analytics`, `Documents`.
- Tabs use chip style; active tab `background: #1D4ED8`, text white.
- Breadcrumb appears when entering nested dashboard pages (e.g., `/dashboard/opportunities/:id`).

## Widget Behaviour
- Modules collapsible. Collapse state stored via `localStorage` `gigvora.dashboard.collapse`.
- Drag-and-drop customisation optional for future release; placeholder handles indicated but disabled in V1.

## Data Refresh Strategy
- Metrics auto-refresh every 5 minutes; manual refresh button top-right of module.
- Tasks updates push via websockets; fallback to poll every 2 minutes.
- Notifications stream in real-time; highlight new entries with `bg-[#DBEAFE]` for 5 seconds.

## Accessibility & Responsiveness
- Provide `aria-expanded` for collapsible modules.
- On mobile, reorder modules: `Metric Overview`, `Tasks`, `Launchpad Progress`, `Opportunities Snapshot`, `Notifications`, `Community Pulse`.

## Visual Anchors
- Use accent gradient strip (4px tall) at top of each module to reinforce grouping.
- Provide subtle background patterns (8% opacity diagonal lines) in Launchpad module to differentiate progress area.
