# Front-end Change Log — Version 1.50 Update

## 07 Apr 2024
- Added a Runtime Health panel to the admin dashboard, consuming `/api/admin/runtime/health` with auto-refresh, manual refresh controls, and detailed dependency/rate-limit visualisations.
- Implemented `useRuntimeHealthSnapshot` hook and `runtimeTelemetry` service to provide cancellable fetches and background polling with abort handling.
- Updated admin dashboard navigation metadata to include the new runtime section and harmonise operations copy with compliance messaging.
