# Version 1.00 – Comprehensive Update Plan

## Programme Context
Version 1.00 unifies Gigvora’s mobile, web, and service layers into a production-ready marketplace. The new feature brief and feature plans prioritise omnichannel collaboration, FCA-compliant trust flows, intelligent discovery, and monetisation. Pre-update issue reports, lists, and fix suggestions are presently empty, so this plan embeds discovery checkpoints to capture and remediate latent defects while shipping the requested capabilities.

## Structured Task Roadmap
1. **Flutter App Platform & Mobile Integration – 8%**
   - **Subtasks**
     1. Scaffold Flutter monorepo with modular architecture, dependency injection, and shared blue design tokens.
     2. Implement onboarding, authentication (passwordless + MFA), and notification plumbing with secure storage.
     3. Deliver chat, live feed, search, projects, jobs, volunteers, and ads screens with offline caching and state management.
     4. Integrate API clients (REST & GraphQL), WebSocket streams, and feature flags for parity with web routes.
     5. Configure CI/CD (Codemagic & GitHub Actions) with automated unit, widget, golden, and end-to-end suites.
   - **Integration Coverage**
     - Backend: Define mobile contracts, authentication guards, and event streaming endpoints for chat/feed.
     - Front-end: Align Flutter UI with React blue design tokens and responsive behaviours for cross-platform parity.
     - User Phone App: Primary delivery; ensure push notifications, deep links, and accessibility reach P95 latency ≤1s.
     - Provider Phone App: Validate sunsetting/merging roadmap and maintain compatibility for agency/company mobile roles.
     - Database: Expand schemas for mobile-specific caches, notification tokens, and offline sync metadata.
     - API: Harden pagination, rate limiting, and GraphQL fragments for mobile consumption.
     - Logic: Embed availability toggles, trust score calculators, and auto-assign acceptance flows locally for resilience.
     - Design: Incorporate blue theming, animations, and UX flows approved in the feature brief.

2. **Communication & Engagement Suite – 6%**
   - **Subtasks**
     1. Refactor messaging backend for multi-thread inboxes, attachment handling, and support escalation routing.
     2. Build floating chat bubble for web/mobile with draggable persistence, unread indicators, and accessibility shortcuts.
     3. Implement live feed aggregation, ranking, moderation queue, and analytics instrumentation.
     4. Deliver feed interactions (follow, like, comment, share, post) with content moderation hooks and audit logging.
     5. Run performance tuning (latency budgets <500ms) and cross-client consistency testing for chat/feed.
   - **Integration Coverage**
     - Backend: WebSocket messaging service, feed ranking engine, moderation APIs, notification queue resilience.
     - Front-end: React components for chat bubble, feed composer, media previews with skeleton states.
     - User Phone App: Flutter widgets for feed, bubble overlay, offline drafts, and push triggers.
     - Provider Phone App: Ensure agency/company mobile dashboards access chat threads and live feed insights.
     - Database: Store conversation metadata, feed posts, reactions, and moderation status with partitioning.
     - API: GraphQL subscriptions/REST endpoints for posts, comments, and support ticket escalation.
     - Logic: Implement throttling, spam detection, and auto-escalation rules for flagged content.
     - Design: Align micro-interactions, reaction animations, and blue brand typography/iconography.

3. **Trust, Payments & Infrastructure Compliance – 5%**
   - **Subtasks**
     1. Integrate FCA-regulated escrow provider, mapping funding, release, refund, and dispute triggers.
     2. Build multi-stage dispute workflow (Startup → Offers → Mediation → Arbitration) with SLA timers and fee capture.
     3. Implement Cloudflare R2 storage services for escrow evidence, media, and ads creatives with lifecycle policies.
     4. Extend ledger, audit logging, and reconciliation dashboards with automated anomaly detection.
     5. Conduct compliance reviews (KYC/KYB, GDPR, threat modelling) and document operational runbooks.
   - **Integration Coverage**
     - Backend: Escrow microservices, dispute orchestrator, ledger reconciliation jobs, signed URL service.
     - Front-end: Financial status components, dispute stage timelines, compliance messaging.
     - User Phone App: Dispute stage UI, payment notifications, evidence upload with offline queue.
     - Provider Phone App: Agency/company finance dashboards for payouts and dispute monitoring.
     - Database: Double-entry ledger tables, dispute case management, compliance audit trails.
     - API: Secure payment endpoints, webhook listeners, signed URL generation, compliance exports.
     - Logic: State machines for escrow/dispute states, fraud detection heuristics, ledger balancing rules.
     - Design: Trust badges, FCA-compliant copy, accessible status indicators across platforms.

4. **Discovery, Matching & Experience Automation – 4%**
   - **Subtasks**
     1. Deploy Meilisearch cluster with indexes for profiles, projects, gigs, jobs, volunteers, ads, and launchpad entries.
     2. Implement LinkedIn-grade filters, saved searches, alerts, and map view for explorer flows, surfacing Experience Launchpad and Volunteer-specific filters.
     3. Build freelance auto-assign engine with ranking criteria (rating, area, language, rates, reviews, availability toggles).
     4. Launch Experience Launchpad workflows (employer criteria, talent onboarding, auto matching, scheduling) across web, Flutter, and provider dashboards.
     5. Deliver Volunteers hub with listings, invitation flows, acceptance tracking, and reporting dashboards tightly integrated with project/job pipelines.
   - **Integration Coverage**
     - Backend: Search ingestion pipelines, matching engine, volunteer/launchpad services, analytics emitters.
     - Front-end: Advanced filter UI, saved search modals, launchpad & volunteer dashboards.
     - User Phone App: Explorer screens, auto-assign queue, launchpad notifications, volunteer mobile flows.
     - Provider Phone App: Company/agency mobile modules for candidate search, assignments, volunteer invites.
     - Database: Indexed tables, denormalised search views, match scores, volunteer availability.
     - API: Search endpoints, auto-assign toggles, launchpad/volunteer actions, alert subscriptions.
     - Logic: Relevance scoring, retry rules, availability toggles, compliance gating for launchpad opportunities.
     - Design: Consistent filter tokens, card layouts, blue theming, and accessibility for large datasets.

5. **Profiles, User Types & Employment Systems – 5%**
   - **Subtasks**
     1. Refactor profile schema for new sections (agency/company type, qualifications, experience, references, areas) with Experience Launchpad eligibility flags and volunteer opt-ins.
     2. Implement trust score calculation, likes/follows counters, and availability toggle service with audit logs powering search, auto-assign, launchpad, and volunteer flows.
     3. Deliver agency dashboards (HR management, payments distribution, projects/gigs pipeline, graduate-to-agency conversions) including volunteer assignments and launchpad cohort monitoring.
     4. Build company dashboards (headhunter management, job listings, ATS stages, interview calendar, analytics) with Experience Launchpad and volunteers surfaced as sourcing channels.
     5. Expand Employment/Jobs board (job creation wizard, screener questions, CV upload/builder, ATS admin tooling) covering Experience Launchpad postings, volunteer opportunities, and full ATS reporting.
   - **Integration Coverage**
     - Backend: Profile services, trust scoring, ATS pipelines, agency/company permission layers.
     - Front-end: Component-based profile UI, dashboards, CV builder, interview scheduling interfaces.
     - User Phone App: Profile editing, status toggles, agency/company mobile views, ATS updates.
     - Provider Phone App: Dedicated agency/company modules for approvals and pipeline tracking.
     - Database: New profile tables, references, ATS stages, interview slots, follow relationships.
     - API: GraphQL fragments for profile components, ATS CRUD endpoints, trust score exposures.
     - Logic: Status automation, trust score algorithms, permission checks, CV parsing.
     - Design: Component guidelines, accessibility for large forms, brand-consistent dashboards.

6. **Project, Gig & Operations Management – 4%**
   - **Subtasks**
     1. Enhance project creation flow with milestone budgeting, timeline, objectives, and in-project chat hooks.
     2. Upgrade gig creation/management dashboards with analytics, scheduling, and compliance checks.
     3. Deliver Project Management module (tasks, dependencies, time tracking, progress analytics, group projects, graduate to agency).
     4. Integrate auto-assign, escrow milestones, and hourly tracking into project workflows with notifications.
     5. Build reporting dashboards for project health, gig performance, and agency involvement.
   - **Integration Coverage**
     - Backend: Project schemas, gig services, time tracking APIs, analytics pipelines.
     - Front-end: React dashboards for project/gig management, Kanban/Gantt visualisations, chat embeds.
     - User Phone App: Project timelines, task updates, gig approvals, time logging UI.
     - Provider Phone App: Agency project oversight, gig allocations, approvals, and financial summaries.
     - Database: Project tasks, milestones, objectives, time logs, gig analytics tables.
     - API: Project creation endpoints, gig management mutations, real-time progress websockets.
     - Logic: Task dependency resolution, progress calculations, notification rules, graduate-to-agency triggers.
     - Design: Operational dashboards, status badges, accessibility for complex data grids.

7. **Monetisation & Brand Refresh – 3%**
   - **Subtasks**
     1. Rebuild homepage with blue theming, responsive layouts, SEO schema, and conversion funnels.
     2. Refresh website and mobile design systems (blue colouring, typography, iconography, accessibility, animations).
     3. Implement Gigvora Ads suite (campaign wizard, targeting, budgeting, creatives, reporting, billing integrations).
     4. Configure Cloudflare R2-backed media delivery for homepage, ads, live feed, and profile assets with observability.
     5. Prepare marketing enablement (copy, visuals, onboarding tours) and monetisation analytics dashboards.
   - **Integration Coverage**
     - Backend: Ads campaign APIs, billing integrations, analytics streaming, homepage content services.
     - Front-end: Homepage redesign, ads management console, responsive components, PWA enhancements.
     - User Phone App: Ads campaign mobile modules, design refresh, homepage parity, marketing prompts.
     - Provider Phone App: Agency/company monetisation insights, ads campaign tracking on mobile dashboards.
     - Database: Ads campaigns, budgets, metrics, homepage content management, media metadata.
     - API: Ads CRUD endpoints, reporting endpoints, CDN signed URLs, marketing analytics.
     - Logic: Budget pacing, targeting eligibility, A/B testing flags, SEO/performance optimisation rules.
     - Design: Blue brand system, ads creatives guidelines, responsive layout patterns.

## Quality Assurance & Issue Handling
- Establish cross-squad triage to populate currently empty issue lists and fix suggestion registers before Sprint 1 closes.
- Embed automated security scans, linting, and dependency updates in every CI pipeline.
- Mandate end-to-end test scripts across backend, frontend, Flutter, provider app, database migrations, APIs, logic validation, and design reviews.

## Reporting & Governance
- Progress will be updated twice weekly in `update_progress_tracker.md`, referencing security, completion, integration, functionality, error-free, production, and overall readiness scores.
- Milestones (see `update_milestone_list.md`) partition the roadmap into manageable increments with clear entry/exit gates.
- Task breakdowns with dependencies are enumerated in `update_task_list.md` for execution within Jira/Epics mapping.
- Compliance, legal, and QA leads must sign off at each milestone before elevating flags to production environments.
