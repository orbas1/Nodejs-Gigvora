# Component Functions – Web Application v1.50

## Navigation Components
- **Global header:** houses workspace selector, omnibox search (cmd/ctrl + K), notification bell, quick-create button, and profile menu. Sticky on scroll with subtle elevation shadow.
- **Primary sidebar:** surfaces primary sections (Home, Launchpad, Work, Insights, Resources, Admin). Allows drag-and-drop reordering of pinned links and collapses to icons at medium breakpoint.
- **Breadcrumb trail:** auto-generates from route schema, supports inline renaming of projects and keyboard navigation (←/→ to traverse).
- **Contextual tabs:** used within dashboards to switch between Overview, Activity, Files, Billing, etc. Tab change preserves filters in query string.

## Layout Components
- **Fluid grid:** 12-column grid with 24px gutters (desktop) and 16px (tablet). Column span tokens (e.g., `.col-span-4`) available for React utility classes.
- **Split view:** left pane shows list or filters, right pane shows detail. Resizable handle persists preference in local storage.
- **Modal sheet:** used for critical actions requiring confirmation; focus trap with ESC close. On mobile, renders as full-screen takeover.
- **Slide-over panel:** anchors to right side for inline editing (e.g., update job post). Supports nested steps with breadcrumb header.
- **Stacked list:** accessible list pattern for sequences (activity, tasks) with `aria-setsize` for screen reader context.

## Data Display Components
- **Metric tile:** shows KPI, delta, timeframe, and sparkline. Hover reveals tooltip with raw values and definition.
- **Timeline rail:** vertical progress steps for escrow releases, onboarding tasks, dispute resolution. Each step icon uses semantic colour tokens.
- **Status badge:** pill-style indicator with icon + label; uses uppercase letters only for critical alerts.
- **Avatar stack:** displays participants; clicking reveals roster drawer with roles and contact actions.
- **Trend card:** large area chart for campaigns; interactive legend toggles series.

## Input Components
- **Multi-step form:** wizard pattern with progress bar and autosave. Each step summarised in review screen before submission.
- **Searchable dropdown:** debounced API calls, keyboard navigation, tags for multi-select. Displays most-used entries top pinned.
- **Date-range picker:** provides relative presets (Today, Last 7 days, Quarter) plus manual selection with timezone awareness.
- **Segmented control:** toggles between list and board views; retains choice per user profile.
- **Inline editor:** double-click to edit table rows with validation and rollback controls.

## Feedback Components
- **Toast notifications:** queue-based with semantic colours; auto-dismiss after 5s except error (requires explicit dismissal).
- **Inline alerts:** anchored near related fields, includes remediation CTA. Error alerts support link to support chat.
- **Skeleton loader:** displays placeholders for cards, tables, forms during fetch. Duration capped to 1.5s to reduce perceived latency.
- **Empty state templates:** include illustration, messaging, and primary CTA tailored by page (e.g., “Create your first gig”).

## Communication Components
- **Comment thread:** supports @mentions, emoji reactions, attachments, edit history. Real-time updates via WebSocket.
- **Quick reply composer:** trimmed version of rich text editor with macros (/, to insert canned responses).
- **File attachment module:** previews documents, flags compliance warnings for restricted file types.

## Commerce Components
- **Escrow summary widget:** summarises funded amount, released, held, and upcoming deadlines. Links to transaction ledger.
- **Payout calculator:** interactive slider to model release schedule; updates summary cards dynamically.
- **Subscription card:** displays plan benefits, price toggles (monthly/annual), highlight recommended plan with emphasised border.

## Integration Components
- **Marketplace tile:** shows app icon, description, rating, install/manage CTA. Badges for verified partners.
- **Webhook log table:** paginated table with status icons, replay action, raw payload modal.
- **API key manager:** displays masked key, copy, rotate, revoke actions. Surface audit log link.
