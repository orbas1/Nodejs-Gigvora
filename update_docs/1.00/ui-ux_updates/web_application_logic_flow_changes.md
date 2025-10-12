# Web Application Logic Flow Changes – Version 1.00

## Routing & Layout
1. **Route configuration:** `App.jsx` maps main layout routes for home, auth, discovery, marketplace, community, and admin login, ensuring shared header/footer across primary experiences.
2. **Layout shell:** `MainLayout.jsx` wraps pages with gradient background, sticky header, and footer, maintaining visual continuity and scroll position handling.
3. **Navigation state:** `Header.jsx` tracks mobile menu state, applies active nav underline, and surfaces login/register CTAs.

## Homepage Composition
1. **Hero narrative:** `HeroSection.jsx` pairs marketing messaging with live feed preview, CTA buttons, and metrics to orient visitors.
2. **Value proof:** Components such as `FeatureGrid`, `MomentumSection`, and `OpportunitySections` stack to articulate benefits and surface deep links.
3. **Social proof:** `TestimonialsSection` and `CTASection` convert interest into action through trust signals and clear CTAs.

## Authentication Flows
1. **Login/Register:** Dedicated pages present forms with validation, helper text, and route to backend auth endpoints.
2. **Company registration:** Additional fields capture organisation data; flow highlights compliance requirements before completion.
3. **Admin login:** Standalone page emphasises security protocols and gating for internal staff.
4. **Two-step verification:** Web login issues a password challenge then promotes a six-digit verification step. Successful verification persists JWT tokens via the AuthProvider, seeds dashboard data prefetching, and stores refresh tokens for silent renewals.
5. **Session persistence:** Auth context rehydrates on reload using `localStorage`, re-asserts access tokens on the API client, and invalidates the session when logout is triggered anywhere in the shell.

## Feed Experience
1. **Data rendering:** Feed page fetches curated posts, displays cards with engagement actions, and surfaces trending widgets.
2. **Filtering:** Chip controls adjust feed scope (All, Opportunities, Launchpad, Groups) and update list accordingly.
3. **Contribution:** CTA opens composer for sharing updates, aligning with community-first strategy.

## Search / Explorer Logic
1. **State management:** `SearchPage.jsx` combines `useCachedResource` and `useDebounce` to handle snapshots and typed queries with caching TTLs.
2. **Category handling:** Results partitioned by category, each using tailored metadata renderers for cards.
3. **Analytics instrumentation:** Search interactions track queries, filters, and result openings via analytics service.
4. **Status feedback:** `DataStatus` component communicates loading, cache usage, last-updated timestamp, and refresh actions.
5. **Meilisearch integration:** Result hydration now consumes Meilisearch freshness scoring, remote-role flags, and synonym-driven chip filters, falling back to Sequelize listings if the cluster is unreachable.

## Marketplace Pages (Jobs/Gigs/Projects/Launchpad/Volunteering)
1. **Shared sections:** Each page reuses hero, filter controls, and list components to maintain familiarity.
2. **Opportunity cards:** Present summary info, meta chips, and primary CTAs (Apply, Pitch, Join) to convert interest into action.
3. **Support modules:** Side panels display stats, tips, or recommended actions to guide users.
4. **Detail route:** Navigating to `/opportunity/:id` fetches extended data, updates breadcrumb navigation, and surfaces sticky CTA block; analytics log view + conversion events.
5. **Saved search prompts:** If user logged in, prompt to save filters; logic stores preferences and triggers notification digest.
6. **Auto-assign banner:** Opportunities that opt into auto-assign surface a secondary banner summarising the acceptance window, queue length, and launchpad prerequisites. Clicking "Preview eligibility" opens a modal that inspects the authenticated freelancer's scorecard from the auto-assign service and explains any blockers.

## Auto-Assign Queue & Decisioning
1. **Queue surface:** Authenticated freelancers gain a dedicated `/auto-assign` route injected into the primary navigation when they have at least one pending assignment. The page consumes the `/api/auto-assign/queue` endpoint and renders a paginated table showing opportunity name, target type, expiry countdown, and payout summary.
2. **Scorecard drawer:** Selecting an entry opens a right-hand drawer detailing the computed score (availability, skill match, launchpad track alignment) with inline tooltips that mirror the backend scoring weights. The drawer also exposes "Accept", "Decline", and "Request more time" actions that call the new controller endpoints.
3. **Decision handling:** Accepting triggers optimistic UI updates, disables conflicting actions, and redirects to the opportunity detail page with a success toast. Declines immediately promotes the next candidate in the queue and logs analytics events for retry analysis.
4. **Preference management:** Account settings now include an Auto-Assign Preferences panel letting freelancers toggle participation, define preferred opportunity types, set max weekly hours, and pause matching for a defined cooldown. The UI persists changes via the `/api/auto-assign/preferences` endpoint and shows the effective status chips in the queue view.
5. **Notifications:** Real-time updates (WebSocket) and fall-back polling mark queue entries as read, raise toast notifications, and badge the header icon with countdown timers. Expired or reassigned entries collapse into a history accordion for auditability.

## Authenticated Operations Dashboard
1. **Landing conditions:** After successful verification, users are redirected to `/dashboard`, which calls the new dashboard controller. Anonymous visitors are intercepted with a guarded view that explains workspace benefits and links to login/register.
2. **Data orchestration:** `dashboardService` aggregates owned projects, queue metrics, saved searches, and assignment activity in a single payload. The React page memoises response slices for stat tiles, queue cards, activity feeds, and profile panels while refreshing every five minutes.
3. **Queue intelligence:** Project owners see grouped queue summaries with fairness stats, next-action timers, and direct links to regeneration tools. Freelancers simultaneously receive a personal queue module exposing score, priority bucket, and expiry countdown.
4. **Search integration:** Saved search panel surfaces Meilisearch-backed alerts with last-triggered timestamps, reinforcing the "Preview search" request from leadership. The dashboard deep links to `/search` so stakeholders can validate new Explorer improvements quickly.
5. **Telemetry logging:** Refresh actions, queue CTA clicks, and project navigation emit analytics events that pair with backend assignment events, ensuring governance teams can audit fairness outcomes.

## Projects & Collaboration
1. **Projects page:** Highlights fairness-first auto-assign governance, exposes queue status badges, and links directly to the detailed management workspace.
2. **Launchpad & Volunteering:** Provide curated programs and missions with filterable cards and CTAs for registration or commitment.
3. **Groups & Connections:** Encourage community building with join/invite flows and suggestions.
4. **Event workflows:** Group events allow RSVP, add-to-calendar, and share; state updates list counts and sends confirmation email.
5. **Project creation & updates:** Slide-over form validates required fields, stores optional auto-assign settings, and redirects to the workspace; `/projects/:projectId` PATCH requests now persist metadata edits and trigger queue regeneration flows in one call.
6. **Project detail workspace:** `/projects/:projectId` route fetches project overview, queue entries, and event history, binding the update form, fairness sliders, newcomer toggle, and regenerate button to the new service endpoint while logging analytics.

## Profile & Personalisation
1. **Dynamic sections:** Profile page aggregates about info, experience, portfolio, launchpad achievements, volunteering history, and recommendations.
2. **Actionable CTAs:** Buttons for messaging, inviting to projects, endorsing skills, and sharing profile link.
3. **Contextual modules:** Sidebar surfaces contact details, badges, and quick share actions.
4. **Edit flow:** Multi-step edit wizard autosaves progress, warns on unsaved changes, and refreshes read-only view upon publish.
5. **Share modal:** Copy link triggers toast; selecting PDF export calls backend service, shows progress indicator, and emails download link when ready.

## Responsiveness & Accessibility
1. **Responsive classes:** Tailwind utilities adapt layout for mobile/desktop, ensuring nav collapse and card stacking.
2. **Accessibility features:** Semantic headings, focus outlines, ARIA labels, and high-contrast accent usage maintain compliance.
3. **Performance cues:** Lazy loading, skeletons, and caching reduce perceived latency while analytics capture usage patterns.
4. **Reduced motion:** Prefers-reduced-motion media queries disable parallax backgrounds and swap transitions for fades.
5. **Localization readiness:** Copy sources centralised; RTL layout adjustments tested for nav order and card alignment.

## Documentation Reference
- Full flow diagrams, stage-by-stage logic, and mermaid map documented in `Web Application Design Update/Version 1.00 update/Logic_Flow_update.md` and `Logic_Flow_map.md`.
