# Backend Integration Updates — User App

## 19 Apr 2024
- **Prometheus Exporter Snapshot:** Runtime health repository now maps the `metricsExporter` payload (primed flag, last scrape timestamp, failure streak) so Flutter alerts display live exporter freshness.
- **Runbook Deep Link:** Configured exporter alerts to launch the runtime incident guide in-app when failure streak exceeds thresholds, ensuring mobile operators follow the same remediation steps as web.
- **Telemetry Analytics:** Added instrumentation (`runtime_exporter_snackbar_viewed`, `runtime_exporter_runbook_clicked`) to monitor engagement with exporter alerts and feed SRE dashboards.

## 12 Apr 2024
- **Maintenance Contact Propagation:** Runtime health parsing now captures `maintenance.supportContact`, ensuring degraded
  state messaging points mobile users to the correct operations contact when maintenance windows activate.
- **Perimeter Telemetry Capture:** The repository records `perimeter.totalBlocked` from `/api/admin/runtime/health` responses,
  enabling analytics and security tooling to correlate abuse events with mobile usage trends.

## 11 Apr 2024
- **Refresh Token Workflow:** The Flutter app now exchanges stored refresh tokens against `/auth/refresh`, mirroring the
  hardened backend audit trail. The app persists the renewed tokens, records login state via the session controller, and clears
  credentials when the backend returns `401`/`403` so compromised sessions cannot linger on-device.
- **Runtime Health Polling:** Bootstrap now calls `/health/ready` prior to attempting a refresh. When the backend responds with
  maintenance or degraded status, the app surfaces maintenance messaging instead of attempting API calls that would fail.
- **Audit Awareness:** Authenticated refresh requests include the device IP (when available) so backend audit logs capture the
  mobile context alongside web refreshes, supporting forensic analysis and rate controls.
# Backend Integration Changes — User Phone App

## 10 Apr 2024
- `SecurityRepository` now authenticates runtime health endpoint, hydrates maintenance announcements, and caches responses for 60 seconds. Includes retry with exponential backoff and safe default when API unavailable.
- Added parsing utilities converting ISO timestamps to localised countdowns, severity mapping, and metadata hydration for Flutter widgets.
- Removed deprecated `security_operations_sample.dart` mock; dependency injection updated so providers receive live repository instance.
- Updated controller to expose combined `runtimeHealth` model containing health status, rate-limit telemetry, and highest priority maintenance announcement for UI consumption.
- Added TODO for provider app parity and integration tests once Flutter testing environment available.
