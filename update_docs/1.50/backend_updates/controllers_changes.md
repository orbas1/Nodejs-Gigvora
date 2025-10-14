# Controller Changes — Version 1.50 Update

## `src/controllers/adminController.js`
- Added `runtimeHealth` action that authenticates admin requests and returns the aggregated snapshot from `runtimeObservabilityService`.
- Extended dashboard controller wiring so admin telemetry can be polled without impacting existing platform/affiliate settings endpoints.
