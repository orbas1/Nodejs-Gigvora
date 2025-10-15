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
