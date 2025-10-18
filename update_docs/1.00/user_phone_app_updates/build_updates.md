# User App Build & Pipeline Updates

- Codemagic workflow now provisions ops diagnostics tokens during build by calling the backend `/ops/tokens` endpoint with CI
  credentials. Tokens are stored as encrypted environment variables and injected at runtime via `flutter run --dart-define`.
- Added preflight script `tool/check_env.dart` verifying that required keys (`OPS_TOKEN`, `HEALTH_BASE_URL`, `CONFIG_VERSION`) are
  present before building release artifacts.
- Enabled integration tests targeting the diagnostics repository using mocked HTTP responses to ensure pagination and caching logic
  behave consistently across Android and iOS builds.
