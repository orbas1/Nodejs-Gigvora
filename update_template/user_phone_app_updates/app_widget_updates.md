# Widget Updates — v2024.09.0

## Home Screen Widgets
- **Launchpad Summary Widget**
  - Displays top three tasks, wallet balance snapshot, and mentor availability count.
  - Refresh interval 30 minutes via background fetch; respects Low Power Mode and Data Saver.
  - Tapping tasks opens deep link `gigvora://launchpad/tasks` with RBAC validation.
- **Mentor Quick Action Widget**
  - Provides next session countdown and "Join" CTA 5 minutes prior to start.
  - Handles timezone adjustments automatically using device locale.

## Android Specific
- Reskinned using Material 3 `RemoteViews` with responsive layout for small/large tiles.
- Supports themed icons and dynamic color when user opts-in (Android 12+).
- Broadcast receivers hardened against spoofed intents using exported=false.

## iOS Specific
- Built with WidgetKit supporting small/medium/large sizes and lock screen complications.
- Background refresh budget optimized via `WidgetCenter.shared.reloadTimelines` only when Launchpad data changes.
- VoiceOver labels audited for all states, including skeleton placeholders.

## Security & Privacy
- Widgets request data through secure app extension API; tokens stored in shared keychain with access group `com.gigvora.shared`.
- All network calls enforce TLS 1.3 and certificate pinning consistent with mobile app configuration.
- No PII cached beyond 24 hours; sensitive wallet values rounded to nearest 5 units when displayed on lock screen.
