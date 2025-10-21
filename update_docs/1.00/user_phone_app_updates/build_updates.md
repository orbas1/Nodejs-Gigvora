# Build & Deployment Updates – User App v1.0.0

## Tooling
- Flutter stable 3.19.x toolchain with Dart 3.3 is the baseline; lockfiles refreshed across root and federated packages.
- Melos orchestrates mono-repo tasks so `melos run ci:verify` executes analyzer, unit, and widget tests before any release artifact is minted.
- Android artifacts produced via `flutter build appbundle`; iOS builds rely on `flutter build ipa` with Xcode 15.x toolchain.

## Configuration Management
- Runtime configuration pulled from secure storage at launch with provider overrides used during tests (`shared_preferences` mocks) to guarantee deterministic snapshots.
- Environment templates updated to include mobile origin domains for CORS, analytics DSNs, and feature-flag endpoints.

## Continuous Integration
- GitHub Actions pipeline caches Flutter dependencies, runs `melos bootstrap`, then executes lint/test commands for Flutter, web, and backend workspaces.
- Backend `npm test` runs in parallel, ensuring contract verifiers remain in sync with mobile expectations.
- Build job uploads app bundles/IPAs to artifact storage and triggers Firebase App Distribution & TestFlight lanes for stakeholder review.

## Quality Gates
- Analyzer warnings treated as errors; zero outstanding issues at release cut.
- Integration smoke test boot confirms the app renders feed content after theme hydration, guarding against regressions introduced by provider overrides.
- Dependency vulnerability scans executed via `npm audit --production` (backend) and `flutter pub outdated --show-transitive` (mobile) with remediation tickets logged for any medium/high findings.

## Release Management
- Semantic versioning: mobile app tagged as `v1.0.0` (build `0.1.0+1`), backend tagged `v2024.09-mobile-compat`, frontend `v2024.09-web-parity`.
- Rollout toggled through remote config flags enabling features per cohort; rollback plan includes restoring previous artifacts and revoking feature flags.
