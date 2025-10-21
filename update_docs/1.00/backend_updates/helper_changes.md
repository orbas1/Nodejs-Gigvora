## Helper Changes

- Added shared contract helpers that normalise feature flag guard-rail defaults and environment schedules before exposure to clients, preventing null metadata from leaking into SDKs.
- Updated domain introspection helpers to expose registry access control metadata and observability SLAs so security reviews and operational dashboards can rely on a single parsing path.
