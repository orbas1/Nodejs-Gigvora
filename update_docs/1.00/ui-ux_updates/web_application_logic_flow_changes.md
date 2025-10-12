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

## Experience Launchpad Workflows
1. **Page bootstrap:** `LaunchpadPage.jsx` loads cohort metadata via `GET /api/launchpad/dashboard?cohort=<slug>` and hydrates three state slices—`insights`, `talentForm`, and `employerForm`—so dashboards and forms render from the same data source.
2. **Placements insights:** The `LaunchpadPlacementsInsights` component normalises pipeline metrics (applications, shortlisted, interviews, placements) and job publishing telemetry before rendering stacked stat cards. Each card exposes drill-in links that persist filters via query params (`?view=pipeline&stage=interview`) for analytics attribution.
3. **Talent application form:** `LaunchpadTalentApplicationForm` pre-populates profile fields (skills, availability, location) from the authenticated user; submission POSTs to `/api/launchpad/applications` with schema validation (experience years ≥1, availability hours >0, consent required). Successful submissions trigger optimistic toast confirmation, re-fetch dashboard metrics, and disable resubmission until status changes.
4. **Employer request form:** Employers (or agencies) raise briefs through `LaunchpadEmployerRequestForm`, capturing job summary, required stack, locations, contract type, budget brackets, and timeline. Submissions call `/api/launchpad/employer-requests` and dispatch follow-up events to the CRM queue; the UI surfaces SLA expectations and a status tracker (Received → In Review → Briefing → Candidates Shared).
5. **Cross-form validation:** Both forms share the `useLaunchpadValidation` helper that blocks submission if profile completeness <80%, relevant compliance files missing, or conflicting pending requests exist. Error summaries anchor to invalid sections for accessibility.
6. **Analytics & eligibility:** Every form step emits `launchpad.form.step` events with stage, completion time, and drop-off reason. Eligibility badges ("Fast-track eligible", "Needs compliance") derive from backend scoring payloads and update in real time when inputs change, giving applicants immediate feedback.
7. **Post-submission workflow:** After a submission, the insight dashboard refreshes via React Query invalidation. The placements chart highlights new entries with a pulse animation, and the employer brief table inserts the new row at the top with SLA countdown badges so operators can triage requests immediately.

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
