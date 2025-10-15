# Backend Integration Changes — User Phone App

## 10 Apr 2024
- `SecurityRepository` now authenticates runtime health endpoint, hydrates maintenance announcements, and caches responses for 60 seconds. Includes retry with exponential backoff and safe default when API unavailable.
- Added parsing utilities converting ISO timestamps to localised countdowns, severity mapping, and metadata hydration for Flutter widgets.
- Removed deprecated `security_operations_sample.dart` mock; dependency injection updated so providers receive live repository instance.
- Updated controller to expose combined `runtimeHealth` model containing health status, rate-limit telemetry, and highest priority maintenance announcement for UI consumption.
- Added TODO for provider app parity and integration tests once Flutter testing environment available.
