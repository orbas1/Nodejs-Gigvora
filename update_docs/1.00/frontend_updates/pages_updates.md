# Front-End Page Updates – Communication & Engagement Suite

## Feed Page (`src/pages/FeedPage.jsx`)
- Added optimistic reaction handling with local state reconciliation after API response; supports five reaction types with viewer-state toggles.
- Implemented inline comment drawer fetching comments lazily, displaying skeleton loaders, and surfacing retry copy when errors occur.
- Introduced share composer modal that records shares, updates metrics, and closes automatically on success while logging analytics.
- Added pagination awareness, timestamp of last refresh, and error fallbacks via `DataStatus` for network issues.

## Global Layout (`src/layouts/MainLayout.jsx`)
- Mounted floating `ChatBubble` inside the main layout so messaging access persists across routes without interfering with existing z-index stacks.
- Ensured bubble respects responsive breakpoints, hides on print viewports, and defers loading messaging bundle until user interaction to control performance.

## Messaging Bubble (`src/components/ChatBubble.jsx`)
- Provides inbox list with search filtering, unread badges, support/composer shortcuts, and skeleton states while fetching.
- Thread view renders messages with author alignment, relative timestamps, and resilience to unauthenticated states (sign-in prompt).
- Composer modal handles optimistic sends, error recovery, and analytics instrumentation for conversation creation.

## Supporting Services & Hooks
- `useMessagingCenter` centralises state management (threads, selected thread, messages) and exports handlers consumed by the bubble UI.
- `messagingClient.js` and `feedClient.js` encapsulate API calls, attach auth headers, and expose typed responses used by React components.

## Projects Page (`src/pages/ProjectsPage.jsx`)
- Added "Manage project" CTA linking to the new detail workspace while retaining quick access to the auto-assign queue view.
- Highlighted auto-assign status and queue size badges to advertise the regenerative fairness engine across the listing cards.

## Project Detail Page (`src/pages/ProjectDetailPage.jsx`)
- New management surface combining project metadata editing, auto-assign configuration, live queue snapshot, and activity log in a single form.
- Supports inline fairness tuning (weight sliders, newcomer toggle, max assignments) with one-click queue regeneration and analytics tracking for updates.
- Renders queue entries with avatars, priority buckets, and score breakdowns while listing recent project assignment events for auditing.
- Requires an authenticated actor before persisting changes, surfacing sign-in prompts when unauthorised users land on the workspace.

## Trust Center (`src/pages/TrustCenter.jsx`)
- New operations dashboard surfaces escrow totals, dispute workload, release queues, and R2 evidence health with blue-branded UI blocks aligned to the design system.
- Inline release action buttons call the escrow release endpoint and refresh the overview while presenting success/error banners.
- Integrates bucketed release metrics, dispute cards with SLA visibility, and compliance messaging for Cloudflare R2 evidence pipelines.

## Dashboard Page (`src/pages/DashboardPage.jsx`)
- New authenticated workspace aggregating owned projects, fairness queue telemetry, saved-search alerts, and project activity feed in one responsive canvas.
- Includes stats cards, queue summaries, saved-search list, recent events timeline, and profile/assignment metrics, all driven by the `/dashboard/overview` API.
- Provides manual refresh via `DataStatus`, logout shortcut, and contextual CTAs linking to Auto-Assign, Search, and Projects.

## Login Page (`src/pages/LoginPage.jsx`)
- Integrated with `useAuth` to request secure email codes, verify 2FA, and persist sessions before redirecting to the dashboard.
- Displays inline error banners and disables actions while awaiting backend responses.

## Project Create Page (`src/pages/ProjectCreatePage.jsx`)
- Now requires authentication before submitting briefs, wiring the signed-in user as the project owner for queue generation.
- Surfaces sign-in messaging when anonymous visitors attempt to launch a project.

## Header (`src/components/Header.jsx`)
- Added avatar rendering, logout controls, and conditional nav links (`Dashboard`, `Launch Project`, `Trust Center`, `Auto-Assign`) based on session state.
- Mobile drawer now offers logout for authenticated users while preserving login/register CTAs for anonymous visitors.
