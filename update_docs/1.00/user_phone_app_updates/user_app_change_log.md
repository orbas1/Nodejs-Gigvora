# User App Change Log

## v1.0.0 (Build 0.1.0+1)
- Delivered full parity with Gigvora web workflows including feed, calendar, explorer, finance, and settings modules.
- Hardened authentication with device-aware session metadata, biometric unlock toggles, and refreshed RBAC policies for mobile personas.
- Added offline-friendly banners and caching hints across feed and calendar to keep members productive without connectivity.
- Introduced localization controls, dynamic theming, and accessibility improvements for TalkBack/VoiceOver, large text, and reduced motion preferences.
- Updated build pipeline to rely on `melos run ci:verify` and backend `npm test` before packaging iOS and Android artifacts.

## v0.9.0 Beta
- Initial beta exposing feed browsing, basic calendar viewing, and profile editing for invited testers.
- Implemented Riverpod-based session management and design-system-driven layout components.
- Added integration smoke tests ensuring boot sequence remains deterministic under provider overrides.

## v0.8.0 Alpha
- Scaffolded Gigvora mobile foundation project, configured melos workspace, and wired shared packages (`gigvora_foundation`, `gigvora_design_system`).
- Established navigation shell, localization plumbing, and placeholder modules for explorer, finance, and settings.
