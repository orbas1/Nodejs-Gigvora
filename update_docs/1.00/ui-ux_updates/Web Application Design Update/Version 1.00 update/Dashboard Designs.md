# Dashboard Design – Web Application Version 1.00

## Layout Overview
- **Grid:** `grid-template-columns: minmax(0, 2fr) minmax(0, 1fr)` at ≥1280px; collapses to single column <1024px.
- **Header Bar:** Summary top bar 112px height with welcome message, quick stats (3 chips), and quick action button.
- **Spacing:** Section gap 32px, card padding 24px.

## Modules
1. **Metric Overview**
   - Row of 3 `DashboardMetricCard` components (Revenue, Active Opportunities, Conversion Rate).
   - Each card height 220px; includes sparkline, delta, tooltip.
2. **Tasks Queue**
   - Card width spans two columns on desktop, height 360px with scroll area 240px.
   - Task item row height 64px, includes checkbox, title, due date, CTA.
3. **Launchpad Progress**
   - Panel height 320px, includes progress bar (height 12px). Steps list with icons 24px.
4. **Notifications**
   - Card height 320px, lists 6 latest notifications. Each entry 56px, includes icon, timestamp.
5. **Opportunities Snapshot**
   - Table-style card summarising pipeline stages; uses segmented controls for `Applied`, `Invited`, `In Review`.
6. **Community Pulse**
   - Card showing trending groups, upcoming events; includes CTA to view calendar.

## Quick Actions Drawer
- Floating button bottom-right (64px). On click, opens drawer width 360px listing quick actions (Post opportunity, Create launchpad, Invite team, Contact support).
- Drawer uses `shadow-medium`, `border-radius: 24px`, `padding: 28px`.

## Visual Hierarchy
- Primary metric row uses accent gradient backgrounds; other cards stay neutral.
- Module headings use `heading-sm` 600 weight. Links `View all` styled as tertiary button.

## Responsiveness
- On tablet, metric cards become horizontal scroll. Provide `overflow-x: auto` and gradient fade edges.
- Launchpad progress and notifications stack under tasks on mobile.

## Accessibility
- Task list keyboard navigable with arrow keys. Provide `aria-live` for new notifications.
- Progress bars include `aria-valuenow`, `aria-valuemax`, descriptive text.

## Data Sources
- Metrics via `/api/dashboard/metrics` (refresh 5 min).
- Tasks via `/api/dashboard/tasks` with patch for completion.
- Notifications via websocket channel `dashboard.notifications`.

## Visual Assets
- Illustrations minimal; use icon badges from Heroicons/Phosphor sized 32px.
