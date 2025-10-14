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
3. **Launchpad Placements Insights**
   - Grid of four cards (Applications, Shortlisted, Interviews, Placements) each 260px height with stacked metrics: primary total, WoW delta chip, micro sparkline.
   - Cards expose CTA `View pipeline` linking to filtered dashboard view; use `aria-live` to announce refreshed totals post submission.
4. **Employer Briefs Table**
   - Table height 360px with sticky header. Columns: Employer, Track, Status badge, SLA countdown, Brief owner.
   - Row colours shift to amber when SLA <8 hours. Includes inline "Assign partner" button.
5. **Finance Overview Hero**
   - Trio of cards ("Releasing this week", "Outstanding splits", "Teams covered") using `FinanceMetricCard` variant with inline sparkline (height 42px) and CTA chips linking to batch or export drawers.
   - Cards animate deltas via `animate-pulse` when backend sends new amounts; tooltips clarify multi-currency conversions.
6. **Upcoming Payout Batches**
   - Table height 420px with sticky header and expandable rows; columns: Batch, Total, Release date, Owner, Status (chip), Export.
   - Expanding a row reveals split summary list, compliance warnings, and quick actions (Schedule release, Escalate, Open ledger export).
7. **Outstanding Split Tracker**
   - List card stacking unresolved splits with avatar, amount owed, days outstanding, and action buttons (Remind, Adjust, Escalate).
   - Filter chips across top (`All`, `Overdue`, `Needs info`, `Compliance hold`) update list instantly with React Query cache updates.
8. **Teammate Distribution**
   - Donut chart module sized 320px diameter with legend stacked right; tooltips show count + value, subtext surfaces variance vs expected distribution.
   - Inline alert banner appears when variance >3%, linking to `Resolve variance` flow inside batch drawer.
9. **Export Readiness Checklist**
   - Vertical timeline card covering CSV export, accounting pack, treasury upload, and SFTP drop; each item toggles to complete with timestamp + owner.
   - Items locked (disabled + tooltip) until outstanding blockers resolved; final action triggers audit modal before download.
10. **Notifications**
   - Card height 320px, lists 6 latest notifications. Each entry 56px, includes icon, timestamp.
11. **Opportunities Snapshot**
   - Table-style card summarising pipeline stages; uses segmented controls for `Applied`, `Invited`, `In Review`.
12. **Community Pulse**
   - Card showing trending groups, upcoming events; includes CTA to view calendar.

## Quick Actions Drawer
- Floating button bottom-right (64px). On click, opens drawer width 360px listing quick actions (Post opportunity, Create launchpad, Invite team, Contact support, Trigger urgent payout, Notify finance).
- Drawer uses `shadow-medium`, `border-radius: 24px`, `padding: 28px`. Finance actions require confirmation modals capturing reason + effective date for audit logging.

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
- Core metrics via `/api/dashboard/metrics` (refresh 5 min).
- Finance hero & tables via `/api/agency/finance/payouts`, `/api/agency/finance/splits`, `/api/agency/finance/exports` (refresh 2 min, manual refresh CTA available).
- Tasks via `/api/dashboard/tasks` with patch for completion.
- Notifications via websocket channel `dashboard.notifications` plus finance events `finance.payouts.updated` for toast triggers.

## Visual Assets
- Illustrations minimal; use icon badges from Heroicons/Phosphor sized 32px.
