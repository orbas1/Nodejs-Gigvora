# Dashboard Organisation & Information Architecture – Web Application Version 1.00

## Primary Zones
1. **Overview Zone (Top Row)**
   - Contains welcome message with avatar, quick metrics, and action chips.
   - Height 112px; background `rgba(255,255,255,0.92)` with subtle border bottom.
2. **Finance Zone (Upper Middle)**
   - Spans full width at desktop: `Finance Overview Hero`, `Upcoming Payout Batches`, `Outstanding Split Tracker`, `Teammate Distribution`, `Export Readiness Checklist` arranged in 2-column mosaic (hero + batches left, split tracker + checklist right, donut anchored beneath split tracker).
   - Section header includes filter toggles for currency + timeframe and "Download audit" ghost button.
3. **Execution Zone (Lower Left Column)**
   - Houses `Tasks Queue`, `Launchpad Progress`, `Opportunities Snapshot` stacked vertically once finance panels scroll out of view.
   - Spacing 24px between modules; tasks remain pinned via sticky top offset `top: 96px` on tall screens.
4. **Insight Zone (Right Column)**
   - Contains `Metric Overview`, `Notifications`, `Community Pulse`, plus finance alerts inserted ahead of notifications when compliance flags raised.
   - Right column width 360px with auto-expanding to 420px at ≥1440px.

## Information Priority
- Primary metrics (Revenue, Active opportunities, Conversion) at top for immediate insight followed by finance hero cards to reinforce payout health.
- Tasks emphasised with bold titles and due date chips. Overdue tasks tinted `#FEE2E2` background.
- Finance panels prioritise compliance risk: outstanding splits sorted by severity, export blockers surfaced before optional downloads.
- Notifications show severity icon (info, success, warning) using accent semantics; finance-specific alerts include ledger icon and link into batch detail.

## Navigation Integration
- Secondary nav tabs below header: `Overview`, `Finance`, `Opportunities`, `Analytics`, `Documents`.
- Tabs use chip style; active tab `background: #1D4ED8`, text white.
- Breadcrumb appears when entering nested dashboard pages (e.g., `/dashboard/opportunities/:id`); selecting `Finance` anchors to payout section with preserved query params.

## Widget Behaviour
- Modules collapsible. Collapse state stored via `localStorage` `gigvora.dashboard.collapse` with finance modules grouped (collapsing hero hides batches + split tracker).
- Drag-and-drop customisation optional for future release; placeholder handles indicated but disabled in V1.
- Finance zone supports "pin" action keeping payout hero visible on scroll for treasury roles.

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
