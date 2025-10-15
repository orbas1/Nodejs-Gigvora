# Controller Changes — Version 1.50 Update

## `src/controllers/adminRuntimeController.js`
- New controller exposing maintenance announcement registry, create/update actions, and status transitions with structured error
  handling and audit metadata for admin operations teams.
- Leverages runtime maintenance service to enforce chronology, severity, and targeting rules while translating service results
  into API-friendly payloads with caching and pagination hints.

## `src/controllers/runtimeController.js`
- New public controller returning active/upcoming maintenance announcements based on audience/channel filters. Applies short-term
  caching headers and gracefully handles empty states for web/mobile banners.

## `src/controllers/adminController.js`
- Added `runtimeHealth` action that authenticates admin requests and returns the aggregated snapshot from `runtimeObservabilityService`.
- Extended dashboard controller wiring so admin telemetry can be polled without impacting existing platform/affiliate settings endpoints.

## `src/controllers/searchController.js`
- Updated opportunity searches to rely on canonicalised category aliases, boolean facet toggles, and sanitised filter/viewports provided by the validation middleware.

## `src/controllers/searchSubscriptionController.js`
- Simplified update/delete actions to consume numeric identifiers supplied by validation, keeping business logic focused on service calls.

## `src/controllers/financeController.js`
- Consumes sanitised query parameters and path identifiers so finance overviews respect boolean refresh flags and integer IDs without manual parsing.

## `src/controllers/complianceLockerController.js`
- Propagates request logging context and correlation IDs into compliance locker service calls so dependency guard failures are traceable in operational logs.
- Returns `503 Service Unavailable` responses with request IDs when compliance storage maintenance or credential gaps block document creation, versioning, or reminder acknowledgement flows.
- Relies on upstream Zod validation to reject malformed bodies with `422` responses, ensuring controller branches always receive sanitised payloads before delegating to the locker service.

## `src/controllers/consentController.js`
- New admin controller providing consent policy CRUD, version management, and
  activation workflows. Validates payloads via shared schemas, enforces RBAC
  guards, and serialises responses with pagination/export metadata for the
  React admin governance console.
- Emits structured audit events for every administrative action (policy create,
  version publish, activation, override), ensuring compliance teams can trace
  decisions back to actor identity and change reason codes.
- Returns jurisdiction-aware policy payloads that include localisation manifests
  and outstanding backfill counts, giving operators visibility into rollout
  readiness before activating new terms.

## `src/controllers/userConsentController.js`
- New user-facing controller exposing consent snapshots, acceptance, and
  withdrawal endpoints for GDPR parity across clients. Guards access by ensuring
  requesters can only act on their own user ID or delegated accounts with audit
  justification.
- Normalises locale/channel metadata before delegating to `consentService`,
  guaranteeing mobile and web clients capture consistent audit trails regardless
  of source surface.
- Handles non-revocable withdrawals by returning `409 Conflict` with guidance,
  while successful acceptance/withdrawal responses include updated outstanding
  requirements so downstream UIs can refresh eligibility states without extra
  queries.
