# Web Application Logic Flow Changes — Aurora Release

## Overview
Aurora aligns the web application logic with the revamped workspace architecture, ensuring consistent RBAC enforcement, secure API orchestration, and improved observability. The new flows emphasize clarity for Admin/Manager personas while maintaining contributor simplicity.

## Core Flow Adjustments
### Workspace Landing Flow
- **Previous**: Multi-step load fetching analytics, tasks, and communications sequentially.
- **Updated**: Parallel data fetching using `Promise.allSettled` with cancellation support; loading skeleton displayed until critical payloads available.
- Introduced fallback to cached snapshot when API latency exceeds 800ms.
- Security guard ensures RBAC state retrieved before rendering actionable modules.

### Task Board Interactions
- Implemented optimistic UI updates backed by server-sent events to sync final state.
- Added `useTaskBoardPermissions` hook verifying operations based on `RequireRole` component.
- Introduced audit logging for bulk updates, writing to `/audit/task-actions` endpoint.

### Escrow Automation
- Configurations now persisted through `agencyEscrow` service with versioning metadata.
- Added dry-run simulation for automation rules before activation, storing results in `EscrowActivityPanel` state.
- Hooked into backend event stream `escrow:automation` to surface change history.

### Notification Center
- Reworked data store using Zustand for predictable state management.
- Added SLA countdown timers that emit warnings at 15 and 5-minute marks.
- Integrated role-based filters allowing Admin to view all notifications, Managers to view workspace-level, and Contributors only assigned items.

### Support & Escalation Flow
- Added contextual triggers connecting SupportLauncher with workspace context, ensuring CORS-compliant API calls to support endpoints.
- Introduced real-time Chatwoot session linking to workspace ID for traceability.

## Performance Enhancements
- Memoized heavy selectors using React `useMemo` and background data prefetch for upcoming tabs.
- Implemented HTTP/2 server push for essential workspace data when available.
- CDN caching tuned for static assets; dynamic API responses now use ETag-based caching with conditional requests.

## Security Hardening
- CORS policy updated to require explicit `Origin` match, rejecting wildcard subdomains.
- All sensitive actions wrapped in dual confirmation modals, logging reason codes for audits.
- WebSocket connections validated via signed tokens with 5-minute expiration.

## Observability
- Added instrumentation with OpenTelemetry to trace workspace interactions across services.
- Introduced business metrics for workspace health (active tasks, escalations, time-to-approve) piped into metricsRegistry.
- Error budgets defined; alerts trigger if failure rate exceeds 0.5% over 5-minute window.

## QA Deliverables
- Updated sequence diagrams stored at `docs/flows/web-app-aurora.mermaid`.
- Automated tests expanded to cover RBAC gating scenarios and offline fallbacks (see `update_tests/front_end_test_results.md`).
- Manual regression checklist updated for cross-browser coverage (Chrome, Safari, Edge, Firefox ESR).
