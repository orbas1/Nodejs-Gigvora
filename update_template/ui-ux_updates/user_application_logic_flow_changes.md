# User Application Logic Flow Changes — Aurora Release

## Overview
The Aurora update introduces a unified workspace-centric flow that coordinates deliverables, meetings, and escrow updates. Mobile logic now mirrors the web application state machine, with a focus on secure transitions, offline resilience, and contextual RBAC enforcement.

## Key Flow Adjustments
### 1. Workspace Entry Flow
- **Previous**: Users landed on an agency feed with manual navigation to active projects.
- **Updated**: Deep links drop directly into `ProjectWorkspaceSection` state machine, fetching role permissions via `RequireMembership`. Logic uses cached workspace snapshot before hydrating from `/api/workspaces/:id/overview`.
- **Security**: Validates JWT freshness and membership roles prior to loading sensitive data; falls back to login if token older than 30 minutes.

### 2. Task Update Flow
- Introduced optimistic updates for status changes with rollback if backend validation fails.
- Added concurrency protection by hashing task payloads before PATCH requests to prevent stale overwrites.
- Notifications triggered through `ProjectWorkspaceContainer` event bus with real-time updates via socket channel `workspace:tasks`.

### 3. Escrow Interaction Flow
- Users with `Contributor` role now limited to viewing escrow summary and submitting deliverables; release and dispute actions restricted to `Manager` and `Admin` roles.
- CORS preflight now validated by backend `corsPolicy.js` to ensure mobile origins are whitelisted (`app.gigvora.com`, `mobile.gigvora.com`).
- New dispute creation flow enforces evidence upload before submission and surfaces SLA countdown timers.

### 4. Live Collaboration Flow
- Integrated Agora session token retrieval via `/api/realtime/sessions` prior to launching voice/video.
- Introduced idle detection; sessions auto-terminate after 10 minutes of inactivity to preserve billing credits.
- Added fallback to asynchronous messaging when network quality score < 2.

### 5. Verification Flow
- Tiered KYC steps now orchestrated through `IdVerificationDrawer` states.
- Background sync ensures progress is retained if the user leaves mid-process.
- Logic prevents duplicate document uploads and enforces MIME-type checks client-side.

## Error Handling & Resilience
- All network calls routed through `apiClient` with exponential back-off (100ms, 300ms, 900ms) and circuit breaker toggles.
- Offline events queue actions locally; once connection restored, queued actions replayed with server acknowledgements.
- Authentication errors trigger secure logout, clearing tokens and stored workspace data.

## Telemetry & Observability
- Each flow emits analytics events (`workspace_flow_started`, `task_status_updated`, `escrow_dispute_opened`) with timestamp, user role, and workspace ID.
- Error events captured by Sentry with user consent gating.
- Performance budgets: workspace entry < 2.5s on 4G, task update < 600ms round trip.

## QA Alignment
- Updated flow diagrams stored in `/docs/flows/user-app-aurora.pdf`.
- End-to-end test cases mapped in `update_tests/test_scripts/user_app_test_script.sh`.
- Manual QA script includes accessibility validation (TalkBack/VoiceOver) and RBAC switching scenarios.
