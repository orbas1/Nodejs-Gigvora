# User App Backend Integration Updates

- Updated the API client in `lib/core/network/api_client.dart` to request authenticated health data using the new `opsDiagnostics`
  scope. Tokens are stored in encrypted Hive boxes (`secure_settings`) and refreshed proactively.
- Added `DiagnosticsRepository` that polls `/health/ready` with pagination support and normalises queue metrics for Flutter
  charts. The repository debounces refreshes to avoid hitting backend rate limits.
- Implemented `PlatformSettingsService` listener to react to maintenance notice broadcasts coming from the backend settings API.
  Notices trigger in-app banners and optional forced logout flows depending on severity.
