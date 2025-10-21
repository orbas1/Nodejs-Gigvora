# Gigvora User App Change Log — v2024.09.0

## Highlights
- Launchpad dashboard redesigned with adaptive cards, delivering faster access to top actions.
- Mentor booking streamlined with real-time availability checks and calendar exports.
- Wallet insights refreshed with biometric confirmation and detailed payout breakdowns.
- Notifications inbox now groups messages and provides localized quick actions.

## Detailed Changes
### Enhancements
- Added Launchpad API v2 integration with RBAC-aware content delivery.
- Introduced biometric re-authentication for wallet transfers above user-defined thresholds.
- Enabled contextual quick replies in messaging based on active projects.
- Added accessibility toggles for high contrast charts and large text support.

### Fixes
- Resolved issue where mentor cancellations ignored timezone offsets.
- Fixed duplicate push notifications caused by legacy device tokens.
- Corrected wallet history pagination to maintain chronological order across locales.
- Addressed CORS misconfiguration for beta domain, ensuring preflight succeeds.

### Performance
- Cold start optimized by deferring analytics SDK initialization.
- Improved caching of mentor availability data, reducing API calls by 32%.
- Implemented streaming pagination for wallet transactions.

## Known Issues
- Rare layout shift on small devices when 5+ Launchpad cards pinned; mitigated by fallback layout.
- Deep link `gigvora://wallet/top-up` opens web fallback for markets lacking native flow (tracked #MOB-2143).

## Deprecations
- Legacy Explore tab removed; users redirected to Launchpad dynamic cards.
- Deprecated wallet CSV export; replaced with shareable summary PDF.

## Release Artifacts
- Android: `gigvora-user-app-v2024.09.0-staging.apk`
- iOS: `gigvora-user-app-v2024.09.0-staging.ipa`
- Test suite: `update_tests/test_scripts/user_app_test_script.sh`

## Approvals
- Product: ✅ (9/24/2024)
- Engineering: ✅ (9/25/2024)
- Security: ✅ (9/25/2024)
