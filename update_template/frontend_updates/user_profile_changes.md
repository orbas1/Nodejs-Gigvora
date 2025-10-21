# User Profile Changes

## Experience Vision
- Instill confidence for prospective collaborators by showcasing trustworthy behaviours and clear next steps.
- Provide personalised recommendations to guide users toward higher engagement.
- Maintain privacy controls while surfacing meaningful insights.

## Key Improvements
1. **Activity Timeline**
   - Chronological view of interactions (bookings, reviews, verifications) with filters and export options.
   - Badges mark milestones such as "First completed project" or "Verified identity".
2. **Recommendation Carousel**
   - Suggests actions like "Request a provider review", "Enable two-factor authentication", "Explore mentoring".
   - Powered by recommendation service leveraging collaborative filtering and rule-based fallbacks.
3. **Verification Banner**
   - Prominent hero component summarising verification status, pending checks, and expiry reminders.
   - Includes CTA to update identity documents or enable advanced security.
4. **Preference Centre**
   - Central hub for language, notification, accessibility, and privacy settings.
   - Changes persist via `/api/profile/preferences`; backend CORS allowlist updated for mobile web origin.

## Accessibility & Performance
- Skeleton loaders for timeline and recommendations reduce perceived wait time; real data arrives under 1.2s P95.
- VoiceOver/Screen Reader labels confirm context for trust badges and recommended actions.
- Colour contrast tuned to 4.8:1 minimum; icons accompanied by descriptive text.

## Security & Privacy
- Preference changes require re-authentication if toggling security-sensitive settings (2FA, WebAuthn).
- Audit events emitted for profile data exports, privacy toggles, and verification submissions.
- Data minimisation ensures only aggregated trust metrics stored; raw documents retained per compliance retention schedule.
