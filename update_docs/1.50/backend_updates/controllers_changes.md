# Controller Changes — Version 1.50 Update

## `src/controllers/adminController.js`
- Added `runtimeHealth` action that authenticates admin requests and returns the aggregated snapshot from `runtimeObservabilityService`.
- Extended dashboard controller wiring so admin telemetry can be polled without impacting existing platform/affiliate settings endpoints.

## `src/controllers/searchController.js`
- Updated opportunity searches to rely on canonicalised category aliases, boolean facet toggles, and sanitised filter/viewports provided by the validation middleware.

## `src/controllers/searchSubscriptionController.js`
- Simplified update/delete actions to consume numeric identifiers supplied by validation, keeping business logic focused on service calls.

## `src/controllers/financeController.js`
- Consumes sanitised query parameters and path identifiers so finance overviews respect boolean refresh flags and integer IDs without manual parsing.
