# Upload Brief — Gigvora User App v2024.09.0

## Executive Summary
- **Release focus:** Marketplace productivity, secure messaging, and analytics transparency for mobile users.
- **Target platforms:** Android (minimum SDK 24), iOS (minimum iOS 14).
- **Deployment window:** 2024-09-30 18:00–20:00 UTC with staged rollout (10% → 50% → 100%).
- **Rollback strategy:** Retain v2024.08.3 artifacts in App Store Connect and Play Console with feature flags to disable the new mentoring workspace integrations if telemetry indicates issues.

## Objectives & Success Criteria
| Objective | KPI | Target |
| --- | --- | --- |
| Accelerate job discovery | Search-to-apply conversion | ≥ 18% (+5%) |
| Reduce onboarding drop-off | Completion rate for guided onboarding | ≥ 92% |
| Strengthen messaging security | RBAC regression defects | 0 open defects |
| Improve trust & safety | Identity verification completion | ≥ 75% within 48h |

## Scope of Delivery
- Unified **Launchpad dashboard** with configurable cards sourced from the Launchpad API v2 (RBAC aware per workspace role).
- **Mentor booking** flow with async availability sync and cancellation windows enforced server-side.
- Expanded **wallet analytics** with PCI-compliant tokenization and opt-in biometric confirmation.
- Overhauled **notifications inbox** with grouped, swipeable cards and localized quick actions.

## Non-Goals
- Desktop web dashboard parity (tracked separately in web release).
- Agency-only white-labeled theming.
- Offline background sync optimizations (scheduled Q4).

## Compliance, Security & Privacy
- Implements **least privilege RBAC** for Launchpad, Wallet, and Messaging modules (see `app_backend_changes.md`).
- Mobile API calls target the new `https://api.gigvora.com/mobile/v3` endpoint with **CORS restricted** to Gigvora-owned domains and preflight caching capped at 10 minutes.
- End-to-end encryption keys rotated (KMS alias `gigvora/mobile/2024-09`).
- Privacy review complete; data collection unchanged and App Tracking Transparency copy refreshed.

## QA & Verification
- Automated checks executed via `update_tests/test_scripts/user_app_test_script.sh`.
- Manual regression matrix validated on Pixel 6 (Android 14) and iPhone 14 (iOS 17).
- Accessibility spot checks passed (WCAG 2.1 AA) including voice-over, dynamic type, and contrast ratios.

## Launch Checklist Snapshot
- [x] Product sign-off (Head of Mobile)
- [x] Security sign-off (AppSec)
- [x] Legal review (Privacy & Terms updates)
- [x] Customer Support macro updates published
- [x] Release notes localized (EN, ES, FR)

## Distribution Plan
1. Submit builds to internal testing tracks (TestFlight, Play Console closed testing).
2. Run 10% production rollout for 24 hours with real-time dashboards (datadog dashboard `GV-MOB-ROLLOUT`).
3. Expand to 50% after error budget confirmation, finalize 100% deployment within 48 hours.
4. Post-launch survey push via in-app modal (triggered after 3 successful task completions).

## Attachments & Artifacts
- Build artifacts: `gigvora-user-app-v2024.09.0-staging.apk`, `gigvora-user-app-v2024.09.0-staging.ipa`.
- Release notes: `/docs/releases/user-app/v2024.09.0.md`.
- Test evidence: `/update_template/update_tests/user_app_test_results.md`.
