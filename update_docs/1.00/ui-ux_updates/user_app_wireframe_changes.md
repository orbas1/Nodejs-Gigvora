# User App Wireframe Changes – Version 1.00

## Global Navigation
- **Landing state:** App launches into Feed with top app bar (logo, notifications, profile) and bottom navigation for Feed, Explorer, Marketplace, Launchpad, Volunteering, Profile.
- **Search affordance:** Persistent search pill in app bar that expands into full-screen search overlay with recent queries and category shortcuts.
- **Quick actions:** Floating action button contextual to screen (e.g., "Post update" in Feed, "Save search" in Explorer).

## Feed Screen
- **Header:** Eyebrow label "Live Feed", hero statement, and filter chips (All, Opportunities, Launchpad, Groups).
- **Post card:** Avatar, name, timestamp, headline, body text truncated to 3 lines, metadata row (reactions, comments, share) using icon buttons.
- **Status banners:** Inline offline/refresh banners appear above list when cached data served.
- **Composer:** CTA at top linking to create post modal with text area, media upload, poll toggle.

## Explorer Screen
- **Search field:** Prominent TextField with heroicons search icon, placeholder guidance, and voice input button.
- **Category tabs:** Horizontal chips (Jobs, Gigs, Projects, Launchpad, Volunteering, People) with accent underline for active tab.
- **Result cards:** Card layout with badge, title, description snippet, meta chips, "View details" button; fallback skeletons while loading.
- **Filters drawer:** Slide-over panel offering filters (Location, Experience, Remote, Budget) with apply/reset controls.

## Marketplace Screens (Jobs, Gigs, Projects, Launchpad, Volunteering)
- **Shared scaffold:** Title/subtitle hero, search field, offline/error banners, refreshed timestamp, list with cards.
- **Card anatomy:** Meta chips row, title, snippet, CTA button (Apply, Pitch, View program, Join mission) aligned left.
- **Empty state:** Centered card with illustration placeholder, message, and CTA to adjust filters or enable alerts.
- **Pull-to-refresh:** Native indicator resets list; CTA row persists.
- **Detail drill-in:** Tapping card transitions to dedicated detail screen with hero, description, requirements, timeline, related opportunities carousel, and sticky bottom CTA.
- **Saved items:** Bookmark icon toggles, saved view accessible via header action listing cards with sort controls.

## Profile Screen
- **Hero section:** Cover gradient, avatar, display name, tagline, and CTA buttons (Edit profile, Share profile).
- **Stats row:** Cards for Connections, Launchpad badges, Endorsements.
- **Sections:** About, Experience timeline, Projects, Portfolio gallery, Launchpad progress, Volunteer history.
- **Action footer:** Buttons for Message, Invite to project, Endorse.
- **Edit mode:** Stepper-style editor for personal info, skills, availability, and showcase media with inline preview.

## Authentication & Onboarding
- **Login:** Card with email/password fields, remember toggle, SSO placeholders, forgot password link, CTA button.
- **Register:** Stepper for personal details → skills/interests → security; progress bar at top.
- **Company registration:** Separate flow capturing organisation info, compliance consent, and admin invites.
- **Welcome tour:** After signup, 3-card carousel explaining feed, explorer, and launchpad benefits with CTA to personalise profile.

## Admin Login
- **Secure card:** Darkened background overlay, centered card with admin crest icon, email/password, OTP fallback, and warning copy.
- **Support link:** Inline link to compliance team for access issues.

## Notifications & Inbox
- **Notification centre:** Modal sheet listing grouped notifications (Projects, Launchpad, Volunteering) with mark-all read.
- **Inbox:** Two-tab layout (Messages, Requests); conversation list shows avatar, snippet, timestamp; detail view includes attachments and quick actions.
- **Request approval:** Dedicated screen summarising project invites with Accept/Decline CTA and context details.
- **System alerts:** Inline banners for compliance reminders, profile completeness nudges, and launchpad milestone updates.

## Settings & Support
- **Settings list:** Sections for Account, Preferences, Notifications, Security with toggles/switches.
- **Support hub:** Search input, top articles, contact support CTA, and status of open tickets.
- **Device management:** List of active sessions with revoke button, showing device type and last active timestamp.
- **Privacy controls:** Toggles for profile visibility, data sharing preferences, and export data request CTA.

## Accessibility & Responsiveness
- Supports large text with dynamic type scaling; cards reflow to ensure CTAs remain visible.
- Landscape layout shifts to dual-pane for tablets: navigation rail left, content right.
- VoiceOver/TalkBack labels provided for chips, buttons, and banners; semantics tags applied to lists for smooth navigation.
- Orientation-specific hints ensure hero imagery compresses gracefully; bottom nav converts to rail on tablets with width ≥ 1024px.
