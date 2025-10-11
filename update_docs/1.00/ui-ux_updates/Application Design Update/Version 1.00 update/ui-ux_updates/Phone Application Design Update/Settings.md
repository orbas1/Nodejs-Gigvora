# Settings Architecture – Phone Application v1.00

## Sections & Ordering
1. **Account Security**
   - Profile info
   - Email & phone
   - Password reset
   - Two-factor authentication (OTP, authenticator app)
2. **Preferences**
   - Opportunity alerts (jobs/gigs/projects)
   - Feed density (standard, focus, expanded)
   - Language selection
3. **Notifications**
   - Push categories (network, opportunities, launchpad, volunteering)
   - Email summaries
   - In-app sound & haptics toggles
4. **Support & Legal**
   - Help centre
   - Contact support (email, chat)
   - Privacy policy
   - Terms of service
   - Community guidelines
5. **Advanced**
   - Data export
   - Clear cached data
   - Delete account (flow to confirm modal)

## Interaction Patterns
- Each section uses `SettingsToggleRow` or navigation rows with chevron.
- Sensitive actions (delete account) require confirm modal with red outline button `#DC2626`.
- Provide search field at top to filter settings (auto-scroll to matching items).

## State Management
- Use Riverpod state notifiers to persist preferences locally and sync with backend.
- Toggle updates send API request; show inline spinner while pending.
- Provide optimistic UI with fallback to revert on failure (toast message).

## Accessibility
- Switch controls labelled with additional context (e.g., "Push notifications for launchpad progress").
- Support dynamic type; rows expand to accommodate larger fonts.

## Navigation
- Access via profile overflow menu and from offline/error overlays for quick support.
- Provide deep links for notifications (e.g., "Update your notifications settings") that open at specific section via `ScrollController` jump.

## Data Export & Privacy Controls
- Data export status screen lists past jobs with ability to download if within 7-day expiry window; show warning banner when export contains sensitive data.
- Include toggle for "Share anonymised analytics" defaulting to on with helper text describing benefits.
- Add "Delete account" flow with multi-step confirmation (reason selection, info summary, final confirm). Provide inline link to support.
