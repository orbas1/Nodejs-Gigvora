# Android Release Updates — v2024.09.0

## Platform Support
- Minimum SDK raised to **API level 24 (Android 7.0)**; devices below will remain on maintenance channel.
- Target SDK updated to **API level 34**, satisfying Play Console requirements for 2024.
- Verified compatibility on Google Play integrity API with rollout token TTL reduced to 24h.

## Feature Enhancements
1. **Adaptive Launchpad Widgets**
   - Uses Material 3 adaptive layouts with breakpoint-aware grid.
   - Workspace-specific RBAC enforced via signed JWT appended to every widget fetch request.
2. **Mentor Booking Flow**
   - Jetpack Navigation deep links to `gigvora://mentors/{id}` supported.
   - Offline caching uses encrypted SharedPreferences with AES-256 GCM.
3. **Wallet Analytics Refresh**
   - Charts implemented using MPAndroidChart with color palette aligned to design tokens (`primary600`, `teal500`).
   - Biometric prompt uses `BiometricPrompt` fallback to device PIN.

## Performance & Stability
- Cold start reduced by 28% via deferred initialization of analytics SDKs.
- StrictMode enabled for debug builds, capturing leaked closables; release builds unaffected.
- Crashlytics reporting threshold lowered to surface non-fatal ANRs > 3 seconds.

## Security & Compliance
- Play App Signing rotated with new upload key stored in Gigvora HSM.
- Verified Play Integrity checks for tampered environments; enforcing server-side RBAC fallback roles.
- Updated Network Security Config to pin `api.gigvora.com` with SHA-256 fingerprint valid until 2026-10-01.

## QA Notes
- Espresso smoke tests executed for onboarding, mentor booking, and wallet analytics.
- Accessibility audit run with TalkBack ensuring descriptive labels for action chips.
- No open blocker defects; two low-priority UI nits deferred to v2024.09.1.
