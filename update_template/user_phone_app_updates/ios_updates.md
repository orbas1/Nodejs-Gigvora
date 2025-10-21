# iOS Release Updates — v2024.09.0

## Platform Support
- Minimum supported version remains **iOS 14** with full testing on iOS 17.5.
- Updated build targets to **Xcode 15.3** with Swift 5.9 compatibility.
- Leveraged new `requestReview` throttling APIs to manage in-app review prompts.

## Feature Enhancements
1. **Launchpad Dashboard**
   - Implemented using SwiftUI wrappers for Flutter views to enable native pull-to-refresh.
   - Quick actions integrated with Spotlight and Siri Suggestions.
2. **Mentor Booking**
   - Calendar uses `UICalendarView` bridging for improved VoiceOver hints.
   - ICS attachments automatically added to Calendar app via EventKit after user consent.
3. **Wallet Insights**
   - Apple Pay verified using new payment tokenization handshake; fallback to manual payout instructions when unavailable.

## Performance & Stability
- Reduced Flutter engine warm-up time by pre-warming `FlutterEngine` during onboarding.
- Memory footprint decreased 12% by deferring heavy plugin initialization.
- Crash-free sessions at 99.7% during beta cohort.

## Security & Compliance
- App Transport Security requires TLS 1.3; exceptions removed.
- Keychain items migrated to access group `com.gigvora.shared` with `kSecAttrAccessibleAfterFirstUnlock`.
- Push notification tokens anonymized using SHA-256 salted hashing before storage.

## QA Notes
- XCTest UI suite covers onboarding, mentor booking, wallet analytics flows.
- VoiceOver and Dynamic Type scenarios validated on iPhone SE (3rd gen) and iPhone 14.
- No open App Review compliance concerns; updated privacy manifest for camera and calendar usage.
