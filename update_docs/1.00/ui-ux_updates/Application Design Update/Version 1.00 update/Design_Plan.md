# Application Design Plan – Version 1.00 Update

## Vision & Guiding Principles
- **Creator-first discovery**: Prioritise showcasing creator personality, availability, and proof points the moment users land on the app.
- **Context-aware simplicity**: Surfaces only the actions relevant to the user’s current journey state while keeping advanced controls within one gesture.
- **Accessible brand expression**: Expand brand palette and typography to meet WCAG AA across light and dark contexts without losing brand energy.
- **Composable theming**: Provide tokenised building blocks that let us introduce seasonal or partnership themes without re-exporting whole design files.

## Experience Architecture
### Navigation Framework
- Persistent bottom navigation: Discovery, Bookings, Messages, Wallet, Profile.
- Floating context button: Adapts to “Create Request”, “Share Portfolio”, or “Resume Draft” depending on page context and user type.
- Secondary quick filters anchored below the hero carousel for location, price, and genre/industry.

### Home & Discovery Redesign
1. **Hero Carousel**
   - Rotates campaign, personalised gigs, and community spotlights using behavioural data.
   - Each slide contains CTA, mood imagery, and optional progress indicator for ongoing campaigns.
2. **Segmented Feed**
   - Tabs for “For You”, “Trending”, and “Near You”.
   - Card modules allow injecting editorial playlists, themed collections, or promotional banners.
3. **Creator Cards**
   - Photo, verification badge, rating delta, next available slot, and quick action chips (View, Share, Save).

### Booking Workflow
- Stepper with four states: Select Package → Customise → Schedule → Confirm & Pay.
- Inline validation and progress guardrails ensuring no dead ends.
- Support entry points (chat, FAQs) appear when user hesitates (detected via idle timers or repeated focus on price fields).

### Messaging Refresh
- Redesigned conversation list with status pills (New, Awaiting Reply, Action Needed).
- Rich message composer supporting templates, attachments, and quick-response suggestions.
- Read receipts and presence indicators harmonised with brand animation language.

## Visual & Interaction System
- **Typography**: Migrating to Inter family with explicit scale tokens (T-Display, T-Title, T-Body, T-Label).
- **Colour**: Base palette expanded to 12 roles (Primary, Secondary, Accent, Success, Warning, Surface, Surface Variant, Border, Overlay, Outline, On-Primary, On-Surface).
- **Elevation**: Three depth tiers with shadow tokens tuned for Android/iOS.
- **Motion**: Entrance and exit transitions anchored to Material curve for Android and Spring curve for iOS with 120–240 ms durations.
- **Haptics & Sound**: Haptics for confirmations, subtle sound cues for incoming bookings (optional, user-controlled).

## Accessibility & Compliance
- Minimum 16px tap targets with 24px recommended for primary actions.
- Colour contrast ratio ≥ 4.5:1 for text and 3:1 for non-text elements.
- Supports dynamic type scaling up to 200% without clipping through auto-layout.
- VoiceOver / TalkBack descriptions defined for hero modules, cards, and navigation.
- Biometric authentication flow receives updated copy aligned with legal and security requirements.

## Content & Localization Considerations
- Microcopy guidelines emphasising inclusive language and tonal flexibility (Professional, Friendly, Energetic modes).
- Dynamic content containers support RTL mirroring and fallback fonts for extended character sets.
- Localisation strategy includes placeholder length guardrails and screenshot references per locale.

## Rollout & Experimentation
- Phase 1: Internal dogfood via TestFlight/Play Console with analytics instrumentation.
- Phase 2: 25% production rollout to English-speaking markets, A/B testing navigation vs. control group.
- Phase 3: Global rollout with feature flags for hero automation and high-contrast theme toggle.

## Risks & Mitigations
| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Data dependencies for personalised hero content delayed | High | Medium | Fallback to curated collections and manual campaign scheduling. |
| Increased complexity of theming tokens causes implementation errors | Medium | Medium | Provide developer handoff kit with JSON tokens and usage documentation, plus linting rules. |
| Accessibility regressions | High | Low | Conduct accessibility audits pre-launch and engage external reviewers for compliance certification. |
| Performance issues on lower-end devices | Medium | Medium | Use lightweight imagery, lazy load heavy modules, and set FPS monitoring in QA builds. |
