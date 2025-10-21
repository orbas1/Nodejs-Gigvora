# Mobile Screen Updates – User App v1.0.0

## Global Shell
- Adopted the shared `GigvoraScaffold` to guarantee consistent top app bars, localization access, and optional navigation drawers across every feature surface.
- Bottom navigation destinations now cover Home, Calendar, Marketplace, and Profile routes, aligning with the GoRouter configuration in each screen and mirroring the web IA.
- Introduced reusable status banners for offline and error states that honour design tokens, improving clarity when data is cached or realtime streams reconnect.

## Feed Timeline
- Added explicit onboarding states inside `FeedScreen` so unauthenticated users are prompted to sign in or create an account, while ineligible personas receive actionable guidance sourced from `_allowedFeedRoles`.
- Implemented moderation affordances with `FeedPostEditorSheet` and deletion confirmation dialogs to keep community content safe and reversible.
- Realtime presence indicators display when sockets connect, and pending local post counters reassure members their offline submissions are queued.

## Calendar Workspace
- Calendar lists now group events by ISO day key, with quick edit/delete/toggle actions exposing the same semantics seen on the web dashboard.
- Persona banner displays the signed-in member’s name, email, and membership tier, reinforcing account context before scheduling meetings.
- Refreshed empty state copy motivates planning by suggesting the first action and outlining expected value.

## Finance Control Tower
- Finance screen enforces RBAC with `FinanceAccessPolicy`, presenting contextual messaging when access is denied and a demo login CTA for exploratory users.
- Introduced refresh controls, offline banners, and tabular layouts for escrow cases (`DisputeCase`) and cash flow charts, ensuring parity with the admin console.
- Notifications for outstanding actions now use tonal chips with accessible contrast and descriptive tooltips.

## Explorer & Marketplace
- Explorer grids harmonise data from `discovery_models.dart`, ensuring expertise tags, engagement scores, and availability signals render identically to the web explorer.
- Search categories, filters, and access gating mirror the eligibility rules defined in `kExplorerAllowedMemberships`, guiding members toward the correct workspace upgrades.

## Settings & Account Safety
- Security preferences screen surfaces toggles for two-factor authentication, biometric unlock, session timeouts, and login alerts, mapping directly to `SecurityPreferences` model fields.
- Added descriptive copy explaining compliance requirements and encryption posture to increase trust during onboarding.

## Accessibility & Localization
- All primary screens respond to large text settings, maintain focus order for TalkBack/VoiceOver, and expose semantic labels for icons, buttons, and navigation destinations.
- Language switcher accessible from the app bar leverages `LanguageMenuButton`, allowing instant locale changes without app restarts.

## Testing & Verification
- Widget and integration tests validate screen bootstraps (`integration_test/app_launch_test.dart`) and ensure Riverpod overrides behave deterministically.
- Manual QA scripts executed on both tablet and phone breakpoints verified layout responsiveness, safe-area handling, and orientation resilience.
