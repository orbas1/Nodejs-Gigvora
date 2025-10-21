# User App Wireframe Changes – Task 3

## Global Shell
- Adopted the updated design tokens across the Flutter shell with consistent typography, spacing, and button states derived from the shared system.
- Replaced the legacy side drawer with a role-aware bottom navigation + quick action FAB, mirroring the web timeline-first approach while preserving access to dashboards, inbox, support, and settings.
- Added an onboarding carousel that communicates privacy, community standards, and monetisation options before account creation.

## Timeline & Dashboard
- Updated the home timeline wireframe to highlight real-time opportunity cards, ad placements, and community announcements with inline moderation badges.
- Introduced a dashboard overview screen combining gig/project stats, mentorship bookings, wallet balance, and compliance alerts using stacked cards optimised for vertical scrolling.
- Embedded live service telemetry indicators (timeline status, chat availability) at the top of the dashboard so users know when to expect delays.

## Profile & Settings
- Redesigned the profile wireframe with modular panels for bio, skills, goals, achievements, and privacy controls. Each module collapses into accordions on smaller devices.
- Added dedicated privacy and consent screens where users manage visibility, marketing preferences, and security options (2FA, device management).
- Included export/share actions with confirmation modals that explain data handling and CORS-protected download flows.

## Communication & Support
- Crafted consistent wireframes for inbox, chat threads, and support ticket creation using floating composer bars, attachment previews, and SLA banners.
- Added escalation paths within chat threads allowing users to elevate a conversation to support or operations, highlighting required RBAC scopes.
- Integrated Chatwoot bubble placement on key screens with quick replies, knowledge base suggestions, and transfer indicators.

## Creation Studio & Transactions
- Enhanced the Creation Studio wizard wireframe with progress indicators, autosave toasts, and contextual guidance for copy, pricing, and media uploads.
- Introduced review steps that preview listing metadata and matching outcomes, encouraging users to confirm compliance and financial readiness before publishing.
- Updated transaction flows (checkout, escrow, payout) with step-by-step headers, secure payment badges, and failure recovery options to reduce abandonment.

## Accessibility & Offline States
- Added offline placeholders and retry actions across critical screens (timeline, dashboard, chat) with explanatory messaging.
- Included high-contrast toggles, dynamic font scaling previews, and voice-over annotations to support accessibility testing.
- Documented loading skeleton patterns and error banners to ensure consistent feedback during latency or failures.
