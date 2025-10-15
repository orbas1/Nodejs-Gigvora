# User App Test Results — Version 1.50 Update

| Date | Command | Result | Notes |
|------|---------|--------|-------|
| 24 Apr 2024 | `flutter test test/features/governance/domain_governance_summary_card_test.dart` | ⚠️ Not Run (local) | New widget tests cover loading, error, and remediation-heavy states for the governance summary card; execution deferred until the Flutter SDK is available in CI. |
| 11 Apr 2024 | `flutter test test/features/auth/application/session_bootstrapper_test.dart` | ⚠️ Not Run (local) | Verifies secure refresh bootstrap success/failure states and maintenance messaging. Execution deferred until Flutter SDK is available in CI. |
| 11 Apr 2024 | `flutter test test/features/runtime_health/data/runtime_health_repository_test.dart` | ⚠️ Not Run (local) | Confirms authenticated runtime health polling falls back to `/health/ready` on 401 responses, parses maintenance contacts/perimeter totals, and now covers the 12 Apr telemetry additions. Pending Flutter toolchain availability. |
