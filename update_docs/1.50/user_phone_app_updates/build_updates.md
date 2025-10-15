# Build & QA Updates — User App

## 12 Apr 2024
- Extended runtime health repository tests to assert maintenance contacts and perimeter totals are parsed when the admin endpoint responds with nested sections.
- Captured analytics hooks in widget tests to validate that perimeter-block totals emit telemetry when maintenance banners appear.

## 11 Apr 2024
- Added unit/widget tests for the session bootstrapper and runtime health repository. The new suites document refresh-token
  success/failure flows and readiness fallbacks, providing regression coverage before the Flutter CI lane is restored.
- Documented the requirement to provide `AuthTokenStore.useDriver` overrides in tests so secure storage can be simulated during
  local runs without Hive dependencies.
