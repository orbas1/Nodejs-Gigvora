# Pages & Navigation Updates – Task 3

## Global navigation
- Replaced the previous header with a token-driven navigation shell that supports:
  - Marketing mega menus (Solutions, Platform, Resources) for unauthenticated visitors.
  - Role-aware primary navigation for authenticated members, mapping dashboards, timeline, explorer, studio, inbox, and notifications.
  - Mobile-first menu states that mirror mega menu groupings with contextual descriptions.
- Introduced a role switcher that enumerates active memberships, highlights timeline eligibility, and deep-links into each dashboard workspace.

## Timeline experience
- Rebranded the "Live feed" to "Timeline" across React, Flutter, backend, documentation, and user messaging to align with feature briefs and analytics naming.
- Updated `FeedPage.jsx` copy to emphasise real-time opportunity drops, timeline-specific access requirements, and improved empty states.
- Synced Flutter feed scaffolds and domain moderation errors with the new terminology, ensuring parity in gating and guidance.
- Adjusted backend validation errors, moderation messages, and README references so API consumers and operators reflect the Timeline nomenclature.

## Policy & compliance
- Added a floating `PolicyAcknowledgementBanner` triggered post-login to capture consent for the refreshed Terms, Privacy, Refund, and Community Guidelines pages.
- Wired CTA buttons to existing legal routes (`/terms`, `/privacy`) and persisted acknowledgements per session ID using localStorage for audit-readiness.

## Creation Studio visibility
- Exposed a high-visibility "Launch Creation Studio" action within the authenticated header to accelerate discoverability of the multi-surface creation wizard.
- Ensured marketing navigation includes paths to Creation Studio artefacts, launchpad, and finance tooling to support enterprise evaluation journeys.

## Admin moderation dashboard
- Added a dedicated Admin Moderation workspace route backed by `AdminModerationDashboardPage.jsx` with queue pagination, severity filters, and SLA indicators.
- Introduced overview cards summarising flag volumes, breach counts, and mute utilisation plus a tabular queue management view with inline resolution dialogs.
- Surfaced an audit timeline component streaming realtime updates from the `/moderation` socket namespace and allowing administrators to acknowledge or resolve events with context notes.
