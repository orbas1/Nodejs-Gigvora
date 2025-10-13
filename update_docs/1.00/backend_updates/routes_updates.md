# Routes Updates – Communication & Engagement Suite

## Feed Routes (`src/routes/feedRoutes.js`)
- Replaced legacy placeholder routes with full REST collection supporting list, detail, create, reactions, comments, shares, and moderation actions.
- Applied `requireAuth` guard to all mutating routes (create, reactions, shares, comments, moderation) while allowing public access to read operations for marketing surfaces.
- Standardised async handling via `asyncHandler` wrapper to ensure consistent error translation across controllers.

## Messaging Routes (`src/routes/messagingRoutes.js`)
- Consolidated under `router.use(requireAuth)` to enforce authentication for every messaging endpoint.
- Added explicit support endpoints (`/escalate`, `/assign-support`, `/support-status`) and state management routes (`/state`, `/mute`, `/read`).
- Reordered route definitions to group CRUD, state, and support actions logically, simplifying maintenance and documentation.

## Trust Routes (`src/routes/trustRoutes.js`)
- New router mounted at `/api/trust` exposing escrow account management, transaction lifecycle actions, dispute orchestration, and the trust overview endpoint.
- Release/refund routes accept `transactionId` path params and forward actor notes to the service layer for audit trails.
- Dispute event route accepts evidence payloads that the service uploads to Cloudflare R2 before persisting dispute state changes.

## Project Routes (`src/routes/projectRoutes.js`)
- Introduced `PATCH /api/projects/:projectId` so project metadata edits and queue regeneration can be triggered directly from the management workspace.
- Re-ordered route declarations to keep the more specific `/auto-assign` handler ahead of the generic `/:projectId` bindings, avoiding accidental shadowing.

## Launchpad Routes (`src/routes/launchpadRoutes.js`)
- New router mounted at `/api/launchpad` exposing application, employer, placement, opportunity, and dashboard endpoints.
- Routes cover `POST /applications`, `PATCH /applications/:applicationId/status`, `POST /employers`, `POST /placements`, `POST /opportunities`, and `GET /dashboard`, each wrapped with `asyncHandler` for consistent error handling.
- Dashboard route accepts optional `launchpadId` and `lookbackDays` query parameters to drive the React insight panel without additional bespoke endpoints.

## Freelancer Routes (`src/routes/freelancerRoutes.js`)
- Mounted at `/api/freelancer` to serve the new order pipeline endpoints powering the freelancer dashboard.
- Provides `GET /order-pipeline` plus CRUD routes for orders, requirement forms, revisions, and escrow checkpoints, all delegating to the pipeline service for validation and transactional updates.【F:gigvora-backend-nodejs/src/routes/freelancerRoutes.js†L16-L28】【F:gigvora-backend-nodejs/src/services/freelancerOrderPipelineService.js†L318-L618】
