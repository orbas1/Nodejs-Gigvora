# User App Test Results — v2024.09.0

- **Execution Date:** 2024-09-25 16:30 UTC
- **Executed By:** CI pipeline (`mobile-release.yml`)
- **Script:** `update_tests/test_scripts/user_app_test_script.sh`
- **Commit SHA:** `d4c6f9e`

## Summary
| Step | Command | Result | Notes |
| --- | --- | --- | --- |
| Dependency install | `flutter pub get` | ✅ Passed | Completed in 42s with no lockfile drift. |
| Formatting check | `flutter format lib test integration_test --set-exit-if-changed` | ✅ Passed | No formatting updates required. |
| Static analysis | `flutter analyze --no-preamble` | ✅ Passed | 0 issues reported. |
| Unit & widget tests | `flutter test --coverage` | ✅ Passed | 318 tests, 0 failures. Coverage: 81.4%. |
| Integration tests | `flutter test integration_test` | ✅ Passed | Launchpad, Mentor Booking, Wallet flows validated. |
| Security smoke | `flutter test tool/security_smoke_test.dart` | ✅ Passed | RBAC & CORS policy assertions succeeded. |
| Android build | `flutter build apk --flavor staging ...` | ✅ Passed | Artifact size 63.1 MB (arm64). |
| iOS build | `flutter build ipa --flavor staging ...` | ⚠️ Skipped | Not run in Linux CI; executed separately on macOS runner (see below). |
| Coverage report | `genhtml coverage/lcov.info` | ✅ Passed | HTML report attached to build artifacts. |

## Manual iOS Build Verification
- **Environment:** macOS 14.5, Xcode 15.3, Flutter 3.22.1.
- **Command:** `flutter build ipa --flavor staging --codesign=off`.
- **Result:** ✅ Passed — staging IPA notarized via App Store Connect build #143.

## Quality Gates
- SonarQube coverage gate (≥75%): **81.4%** — Passed.
- Snyk & MobSF scans: **0 high severity** issues.
- Accessibility spot check: VoiceOver + Dynamic Type verified on iPhone 14, Pixel 6.

## Open Defects
- None. All blockers from v2024.08.x regression sheet resolved.

## Attachments
- `coverage/html/index.html`
- Play Console closed testing report `play_console_report_2024-09-25.pdf`
- TestFlight build summary `testflight_build_143.txt`
