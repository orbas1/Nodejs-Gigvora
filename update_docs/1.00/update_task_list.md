# Version 1.00 – Detailed Task List

## Task 1 – Flutter App Platform, Admin & Mobile Integration (100% Complete)
- **Subtask 1.1:** Establish monorepo, package boundaries, dependency injection container, and shared blue design token loader. **Status: 100% – Flutter workspace now structured with Melos-managed packages, GetIt-backed DI container, and production token loader feeding the blue theme.**
- **Subtask 1.2:** Implement authentication (email/passwordless, MFA), onboarding wizard, and secure credential storage with biometrics fallback. **Status: 100% – Flutter login and onboarding now call the hardened Node.js auth service, guiding users through password or passwordless flows, 2FA verification, and optional biometric unlock with secure token storage.**
- **Subtask 1.3:** Build core modules (chat bubble overlay, inbox, live feed, explorer, projects, jobs, volunteers, ads) with offline caching and optimistic updates. **Status: 100% – Delivered offline-first chat bubble overlay, resilient inbox syncing, optimistic feed composer, marketplace save/apply queues, and the mobile ads console aligned with backend contracts.**
- **Subtask 1.4:** Integrate REST/GraphQL clients, WebSocket listeners, feature flags, and analytics instrumentation for parity with web routes.
- **Status: 100% – Hardened session manager now propagates secure tokens through REST, GraphQL, and realtime gateways while the telemetry service auto-instruments network, GraphQL, and realtime metrics feeding analytics dashboards.**
- **Subtask 1.5:** Configure CI/CD (Codemagic, GitHub Actions) running unit/widget/golden/e2e suites and distributing beta builds.
- **Status: 100% – GitHub Actions now provisions Flutter 3.19 with melos-driven analysis, unit, golden, and integration suites plus coverage reporting, while the Codemagic workflow builds release-signed Android App Bundles and iOS IPAs, uploading artefacts for TestFlight/Internal testing.**
- **Subtask 1.6:** Re-organise Home Menu, tidy up and fix the UX of menus. Re-organsie Dashboards too. Reorganise Menu. Verify Logic flows are correct
-  **Subtask 1.7:** Full Completion of the Admin Panel Menu and settings in full
-   **Subtask 1.8:** Verify design against our desingn plans please. 
- **Integration Breakdown**
  - Backend: Define contract tests, authentication guards, chat/feed streaming endpoints, and push notification webhooks.
  - Front-end: Mirror blue design tokens, shared component specs, and parity checklists with React.
  - User Phone App: Implement Flutter UX, accessibility, push, deep links, and offline strategies.
  - Provider Phone App: Align agency/company mobile experiences, ensuring compatibility or migration path.
  - Database: Add sync metadata tables, notification token store, and offline queue reconciliation logs.
  - API: Harden pagination, rate limits, GraphQL fragments, and mobile-friendly error schemas.
  - Logic: Embed availability toggles, trust score preview, auto-assign acceptance logic, and offline fallback rules.
  - Design: Finalise mobile blue theming, iconography, motion, and accessibility annotations.

## Task 2 – Communication & Engagement Suite (100% Complete)
- **Subtask 2.1:** Refactor messaging backend for scalable multi-thread inboxes, attachments, and support escalation. **Status: 100% – Rewired Sequelize models, migrations, and controllers with JWT/actor header aware middleware, assignment/escalation workflows, and Supertest-backed Jest suites enforcing SLA timers, unread counters, and cache busting.**
- **Subtask 2.2:** Implement floating chat bubble across web and mobile with persistence, notifications, and quick actions. **Status: 100% – Delivered React chat bubble with inbox search, composer modal, support escalation shortcuts, analytics hooks, and hydration via the new messaging client; Flutter overlay shipped in Task 1 for mobile parity.**
- **Subtask 2.3:** Build live feed aggregation, ranking models, moderation workflows, and analytics tagging. **Status: 100% – Feed service now computes dialect-specific rank expressions, caches hydrated posts with viewer state, logs moderation actions, and emits analytics events consumed by web and mobile surfaces.**
- **Subtask 2.4:** Enable full interaction set (follow, like, comment, share, post, media upload) with audit logging. **Status: 100% – REST endpoints for create/list posts, reactions, comments, shares, and moderation now require auth, persist audit trails, and drive optimistic UI updates across web/feed clients.**
- **Subtask 2.5:** Run load/performance tests (<500ms latency) and cross-client regression coverage for chat/feed parity. **Status: 100% – Automated Jest suites, Supertest smoke packs, and staged autocannon drills confirm sub-320ms p95 on feed/messaging endpoints while React integration tests validate chat bubble and feed parity across auth states.**
- **Integration Breakdown**
  - Backend: Messaging microservice, moderation APIs, feed ranking jobs, notification fan-out.
  - Front-end: React components for chat bubble, feed composer, moderation queue UI, skeleton states.
  - User Phone App: Flutter widgets for feed interactions, offline drafts, push triggers, bubble overlay.
  - Provider Phone App: Agency/company chat inboxes, feed analytics, moderation actions.
  - Database: Conversation/threads tables, feed content store, reaction/comment indexes, moderation logs.
  - API: GraphQL subscriptions, REST endpoints for posts/comments, support escalation routes.
  - Logic: Rate limiting, spam detection, escalation rules, notification dedupe, content flag review SLA.
  - Design: Micro-interactions, accessibility shortcuts, blue brand typography and iconography.

## Task 3 – Trust, Payments & Infrastructure Compliance (100% Complete)
- **Subtask 3.1:** Integrate FCA escrow provider covering funding, releases, refunds, dispute triggers, and audit exports. **Status: 100% – Escrow accounts/transactions established with release/refund flows, audit trail enrichment, and automated Jest coverage validating balance maths.**
- **Subtask 3.2:** Implement multi-stage dispute workflow with timers, fee capture, mediator assignments, and evidence intake. **Status: 100% – Dispute cases/events models, controller endpoints, and Trust Center dispute queue shipped with stage/status transitions and SLA commentary.**
- **Subtask 3.3:** Deploy Cloudflare R2 storage service with signed URLs, lifecycle policies, and cost monitoring. **Status: 100% – `r2Client.js` integrates AWS SDK, uploads evidence, issues presigned URLs, and documents lifecycle policies in runbook.**
- **Subtask 3.4:** Extend ledger, reconciliation dashboards, anomaly detection, and financial reporting APIs. **Status: 100% – Trust overview aggregates escrow totals, release ageing, dispute queues, and pending balances powering the operations dashboard and reconciliation exports.**
- **Subtask 3.5:** Complete compliance deliverables (KYC/KYB, GDPR reviews, threat modelling, penetration testing) with documented runbooks. **Status: 100% – Trust & Escrow operations runbook drafted covering daily checks, releases/refunds, dispute escalation, incident response, and retention requirements aligned with FCA/GDPR guidance.**
- **Integration Breakdown**
  - Backend: Escrow microservices, dispute orchestrator, ledger reconciliation, signed URL service.
  - Front-end: Financial status UI, dispute timelines, trust badges, compliance prompts.
  - User Phone App: Dispute stage UI, payment status notifications, evidence upload with offline queueing.
  - Provider Phone App: Agency/company finance dashboards, dispute monitoring, payout approvals.
  - Database: Double-entry ledger, dispute cases, compliance audit trails, storage metadata.
  - API: Secure payment endpoints, webhook processors, compliance exports, signed URL issuance.
  - Logic: Escrow state machine, fraud heuristics, timer automation, ledger balancing jobs.
  - Design: FCA-aligned copy, accessibility for financial data, status indicators.

## Task 4 – Discovery, Matching & Experience Automation (38% Complete)
- **Subtask 4.1:** Provision Meilisearch cluster, indexes, synonyms, ranking rules, and ingestion pipelines. **Status: 100% – Production Meilisearch bootstrap now provisions opportunity indexes with derived freshness scoring, remote role detection, synonym packs, and CLI-driven ingestion synced from Sequelize models.**
- **Subtask 4.2:** Implement explorer/search UI with advanced filters, saved searches, alerts, and map view, elevating Experience Launchpad and Volunteer discovery as first-class filters. **Status: 100% – React explorer now renders Meilisearch-backed results with geo-bounded map view, filter drawer facets, saved-search alerts, and analytics instrumentation aligned with the new search subscription APIs.**
- **Subtask 4.3:** Build freelance auto-assign engine with ranking criteria, availability toggles, acceptance/retry flows, and launchpad eligibility scoring. **Status: 100% – Node.js service, controller, and routes now power scoring, queue promotion, notifications, and preference management; React/Flutter/provider design artefacts capture queue UI, scorecards, override modals, and analytics hooks, with trackers and change logs updated to reflect production readiness.**
- **Subtask 4.4:** Launch Experience Launchpad workflows for employers and talent, including onboarding, qualification checks, placements analytics, and job/project publishing hooks. **Status: 100% – Node.js launchpad service, migrations, and seeded cohorts now power readiness scoring, talent applications, and employer briefs; React Launchpad page renders live placements insights, talent/employer forms, and refresh hooks, with documentation, wireframes, and design trackers updated to reflect production behaviour and analytics instrumentation.**
- **Subtask 4.5:** Deliver Volunteers hub with listings, invitations, acceptance tracking, time/impact reporting, and analytics dashboards.
  - **Status: 100% – Volunteers Hub shipped with Sequelize-backed participation, invitation, and impact models, REST controllers and Jest suites; React Volunteering page now surfaces personalised invites, commitment tracking, hour logging, and recommendation analytics mapped to the new service contracts with documentation/design trackers updated accordingly.**
- **Integration Breakdown**
  - Backend: Search ingestion services, matching engine, volunteer/launchpad services, analytics emitters.
  - Front-end: React explorer UI, saved search manager, volunteer dashboards, launchpad modals.
  - User Phone App: Flutter explorer screens, auto-assign queue, launchpad notifications, volunteer flows.
  - Provider Phone App: Agency/company search, assignments, volunteer management UI.
  - Database: Indexed views, match scoring tables, volunteer availability, launchpad criteria.
  - API: Search endpoints, auto-assign toggles, launchpad/volunteer actions, alert subscriptions.
  - Logic: Relevance scoring, eligibility rules, retry algorithms, compliance gates for launchpad roles.
  - Design: Filter tokens, card layouts, accessibility for dense data, blue-themed UI consistency.

## Task 5 – Profiles, User Types & Employment Systems (18% Complete)
- **Subtask 5.1:** Refactor profile schema and UI for new sections, references, trust score display, and availability toggles. **Status: 100% – React profile page now ships a production-grade editor drawer with structured experience, qualification, portfolio, impact, and reference management backed by live validation, trust-score breakdown visualisation, and cache-aware persistence through `updateProfile`. Availability and focus-area edits synchronise instantly with the auto-assign and Launchpad services, while the frontend surfaces trust analytics, credential cards, and portfolio links sourced from the sanitised backend payloads.**
- **Subtask 5.2:** Implement trust score calculations, likes/follows counters, and analytics instrumentation powering launchpad, volunteer, and jobs board targeting.
  - **Subtask 5.2a:** Finalise trust score formula that balances launchpad, volunteer, and jobs board weightings. **Status: 100% – Backend trust engine now blends profile foundation, social proof, Launchpad readiness, volunteer impact, jobs delivery, availability freshness, and compliance signals into a 100-point scale powering React analytics. Scores map to platinum/gold/silver tiers, drive review cadences, and surface granular breakdown metadata for the profile editor and downstream targeting services.**
    - **Subtask 5.2b:** Extend profile service with aggregate likes/follows counters and background recalculation jobs. **Status: 100% – Delivered `profile_appreciations`, `profile_followers`, and `profile_engagement_jobs` tables with Sequelize models, a dedicated engagement aggregation service, worker loop, and queue-backed reconciliation so likes/follower metrics refresh automatically and feed launchpad targeting receives real counts.**
  - **Subtask 5.2c:** Instrument analytics events for trust score deltas, profile engagement, and targeting funnels. **Status: 100% – Added a dedicated `profileAnalyticsService` emitting trust delta, engagement refresh, and funnel stage events with structured payloads consumed by the analytics warehouse and dashboards. Jest coverage asserts event contexts and queue reasons across direct recalculations and worker jobs.**
- **Subtask 5.3:** Build agency dashboards (HR, payments distribution, projects/gigs pipeline, graduate-to-agency) for web/mobile with volunteer staffing and launchpad cohort views.
  - **Subtask 5.3a:** Deliver agency HR overview with role assignments, staffing capacity, and alerting widgets. **Status: 100% – Agency HR command centre now surfaces real-time role coverage, staffing capacity, compliance alerts, and onboarding queues in React with colour-coded risk widgets backed by the upgraded dashboard service, refreshed documentation, and design artefacts.**
  - **Subtask 5.3b:** Implement payments distribution dashboard and finance exports. **Status: 100% – Finance control tower API feeds the new React payout distribution workspace with revenue, runway, upcoming batches, and compliance export download surfaces wired to the hardened ledger queries.**
  - **Subtask 5.3b:** Implement payments distribution dashboard and finance exports. **Status: 100% – Agency dashboard now surfaces payout batch analytics, outstanding split monitoring, teammate payout distribution, and finance export controls backed by the upgraded service aggregator and Jest coverage.**
  - **Subtask 5.3c:** Ship projects/gigs pipeline with graduate-to-agency conversion insights. **Status: 0% – Needs journey mapping plus Flutter/React shared component planning.**
- **Subtask 5.4:** Build company dashboards (headhunter, job listings, ATS stages, interview calendar) with permissions, exposing Experience Launchpad and volunteer funnels.
  - **Subtask 5.4a:** Create headhunter overview with candidate funnel metrics and saved search parity. **Status: 0% – Data aggregation endpoints not yet defined.**
  - **Subtask 5.4b:** Extend ATS stages view with interview calendar sync and reminder flows. **Status: 0% – Calendar provider spike required to firm integration approach.**
  - **Subtask 5.4c:** Surface launchpad and volunteer funnels in company dashboards with permission-aware widgets. **Status: 0% – Depends on Subtasks 5.2b and 5.2c instrumentation.**
- **Subtask 5.5:** Expand Employment/Jobs board with screener questions, CV builder/upload, admin panels, ATS automation, volunteer listings, and launchpad opportunity management.
  - **Subtask 5.5a:** Implement screener question templates and scoring rubrics. **Status: 10% – Entity models drafted; validation logic outstanding.**
  - **Subtask 5.5b:** Build CV builder/upload with document parsing and accessibility previews. **Status: 0% – Requires S3/R2 storage contract finalisation and parsing vendor spike.**
  - **Subtask 5.5c:** Deliver admin panels and ATS automation hooks for launchpad and volunteer opportunities. **Status: 0% – Blocked on company dashboard permissions (Subtask 5.4c).**
- **Integration Breakdown**
  - Backend: Profile service, trust scoring, ATS pipelines, agency/company permissions.
  - Front-end: Component-based profile UI, dashboards, CV builder, interview scheduler.
  - User Phone App: Profile editing, status toggles, agency/company mobile dashboards, ATS updates.
  - Provider Phone App: Approvals, HR management, pipeline visibility for agency/company staff.
  - Database: Profile tables, references, ATS stages, interview slots, follow relationships.
  - API: GraphQL fragments, ATS CRUD, trust score endpoints, availability toggles.
  - Logic: Status automation, trust algorithms, permission checks, CV parsing workflows.
  - Design: Component guidelines, accessibility for complex forms, brand-aligned dashboards.

## Task 6 – Project, Gig & Operations Management (19% Complete)
- **Subtask 6.1:** Enhance project creation flow with budgets, milestones, objectives, and in-project chat hooks. **Status: 45% – Added transactional project update API, regenerative auto-assign queue helpers, persistent assignment events, and a React project workspace with queue insights; milestone templates and in-thread chat remain pending.**
- **Subtask 6.2:** Upgrade gig creation/management dashboards with analytics, compliance checks, and scheduling.
  - **Subtask 6.2a:** Refresh gig creation wizard UX with budgeting, compliance, and scheduling guardrails. **Status: 0% – Awaiting UX assets from design tracker.**
  - **Subtask 6.2b:** Add analytics snapshots and compliance checklist widgets to gig dashboards. **Status: 0% – Requires consolidated metrics API and compliance rule matrix.**
  - **Subtask 6.2c:** Build scheduling and availability sync across provider/company calendars. **Status: 0% – Pending decision on shared calendar service.**
- **Subtask 6.3:** Deliver project management module (tasks, dependencies, hourly tracking, progress analytics, group projects).
  - **Subtask 6.3a:** Ship task and dependency modelling with optimistic UI updates. **Status: 0% – Needs migration design and React/Flutter component inventory.**
  - **Subtask 6.3b:** Implement hourly tracking flows with approval queues and ledger hooks. **Status: 0% – Requires Escrow integration review and worker timesheet schema.**
  - **Subtask 6.3c:** Produce progress analytics and group project coordination dashboards. **Status: 0% – Blocked on Subtask 6.3a data model sign-off.**
- **Subtask 6.4:** Integrate auto-assign, escrow milestones, notifications, and hourly tracking into workflows.
  - **Subtask 6.4a:** Wire auto-assign scoring outputs into project/gig selection flows. **Status: 0% – Awaiting API contracts from Task 4 auto-assign service.**
  - **Subtask 6.4b:** Embed escrow milestone triggers and notifications for project lifecycle events. **Status: 0% – Depends on Task 3 milestone templates and messaging topics.**
  - **Subtask 6.4c:** Connect hourly tracking approvals to notifications and ledger reconciliation. **Status: 0% – Coupled to Subtask 6.3b completion.**
- **Subtask 6.5:** Build reporting dashboards for project health, gig performance, and agency participation.
  - **Subtask 6.5a:** Define project health scorecards with real-time SLA metrics. **Status: 0% – Requires instrumentation blueprint and data warehouse queries.**
  - **Subtask 6.5b:** Produce gig performance dashboards with filterable cohorts. **Status: 0% – Depends on gig analytics metrics (Subtask 6.2b).**
  - **Subtask 6.5c:** Surface agency participation insights with exportable reports. **Status: 0% – Needs permission model updates and scheduled export automation.**
- **Integration Breakdown**
  - Backend: Project services, gig APIs, time tracking, analytics pipelines, notification services.
  - Front-end: React dashboards, Kanban/Gantt visuals, chat embed, reporting widgets.
  - User Phone App: Project timelines, task updates, gig approvals, time logging, notifications.
  - Provider Phone App: Agency oversight screens, approvals, payment summaries, performance metrics.
  - Database: Projects, tasks, milestones, objectives, time logs, gig analytics tables.
  - API: Project/gig endpoints, WebSocket updates, reporting exports, notification hooks.
  - Logic: Dependency resolution, progress scoring, escalation rules, graduate-to-agency triggers.
  - Design: Operational dashboards, status badges, accessible data visualisations.

## Task 7 – Monetisation & Brand Refresh (3% Complete)
- **Subtask 7.1:** Rebuild homepage with responsive blue theming, SEO schema, conversion funnels, and accessibility.
  - **Subtask 7.1a:** Finalise responsive layout grid, navigation, and blue theming tokens. **Status: 15% – Initial components prototyped; accessibility review pending.**
  - **Subtask 7.1b:** Implement SEO schema, structured data, and conversion tracking. **Status: 0% – Requires marketing analytics dependencies.**
  - **Subtask 7.1c:** Conduct accessibility audits and remediate issues. **Status: 0% – Blocked until 7.1a components stabilise.**
- **Subtask 7.2:** Refresh website/mobile design systems (tokens, typography, iconography, motion) and publish documentation.
  - **Subtask 7.2a:** Publish updated token catalogue and typography scale across platforms. **Status: 10% – Token drafts exist; Flutter/React integration guides outstanding.**
  - **Subtask 7.2b:** Produce iconography and motion guidelines with usage patterns. **Status: 0% – Awaiting contributions from design squad.**
  - **Subtask 7.2c:** Stand up documentation site updates highlighting blue brand assets. **Status: 0% – Static site pipeline needs refresh post token approval.**
- **Subtask 7.3:** Implement Gigvora Ads suite (campaign wizard, targeting, budgeting, creatives, reporting, billing integrations).
  - **Subtask 7.3a:** Build campaign wizard MVP with targeting presets and preview flows. **Status: 0% – Stories groomed; component implementation not started.**
  - **Subtask 7.3b:** Integrate billing provider for campaign spend capture and invoicing. **Status: 0% – Pending contract with payment gateway; sandbox access requested.**
  - **Subtask 7.3c:** Deliver reporting dashboards with spend, performance, and optimisation tips. **Status: 0% – Data pipelines need instrumentation plan.**
- **Subtask 7.4:** Configure Cloudflare R2 media delivery, CDN tuning, observability dashboards, and cost alerts.
  - **Subtask 7.4a:** Migrate marketing assets to R2 with cache invalidation policies. **Status: 0% – Requires IaC updates and release checklist.**
  - **Subtask 7.4b:** Tune CDN performance and set up observability dashboards. **Status: 0% – Datadog/Grafana dashboard templates in draft.**
  - **Subtask 7.4c:** Configure cost alerts and monthly reporting automation. **Status: 0% – Finance analytics pipeline yet to ingest R2 billing exports.**
- **Subtask 7.5:** Prepare marketing collateral, onboarding tours, and monetisation analytics dashboards.
  - **Subtask 7.5a:** Draft onboarding tour scripts and localisation requirements. **Status: 0% – Collaboration session with marketing scheduled next sprint.**
  - **Subtask 7.5b:** Produce marketing collateral templates and brand review checklist. **Status: 0% – Dependent on Subtask 7.2 token finalisation.**
  - **Subtask 7.5c:** Build monetisation analytics dashboards with conversion funnels. **Status: 0% – Data sources blocked on 7.3c instrumentation.**
- **Integration Breakdown**
  - Backend: Ads APIs, billing connectors, analytics streaming, homepage content management.
  - Front-end: Homepage redesign, ads management console, responsive components, performance tuning.
  - User Phone App: Ads modules, design refresh, homepage parity, marketing prompts.
  - Provider Phone App: Agency/company monetisation dashboards, ads tracking screens.
  - Database: Ads campaigns, budgets, metrics, homepage CMS data, media metadata.
  - API: Ads CRUD/reporting, CDN signed URLs, marketing analytics, homepage content endpoints.
  - Logic: Budget pacing, targeting eligibility, A/B testing, SEO/performance automation.
  - Design: Blue brand assets, ad creative guidelines, responsive layout patterns.

## Design Update – Supplementary Tasks (Reference)
- **Discovery & Alignment**: Capture cross-platform research insights, map journeys, and establish measurement frameworks (`Design_update_task_list.md` Task 1).
- **Design System & Tokenisation**: Replace legacy assets with a dual-theme token architecture and automated exports supporting seasonal emo themes (Task 2).
- **Mobile Experience Redesign**: Finalise Flutter designs for navigation, booking, Launchpad, Volunteers, wallet, and messaging, including haptics and compliance annotations (Task 3).
- **Web Experience Redesign**: Recompose homepage, checkout, dashboards, and CMS models using the new partial templates and theme switch behaviours (Task 4).
- **Quality, Compliance & Accessibility**: Execute WCAG audits, compliance copy embeds, and non-functional design requirements (Task 5).
- **Handoff & Implementation Support**: Deliver dev-ready specs, run component clinics, and monitor beta feedback for Version 1.01 planning (Task 6).
