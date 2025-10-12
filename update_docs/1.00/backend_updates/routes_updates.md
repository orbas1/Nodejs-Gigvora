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
