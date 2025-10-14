# Version 1.00 – Milestone Breakdown

## Milestone 1: Programme Foundations (Weeks 1–3) – 12% Complete
- **Task 1.1 – Platform & Compliance Kick-off**
  - Subtasks:
    1. Finalise vendor contracts (escrow, Cloudflare R2, analytics, push notifications).
    2. Stand up shared environments (staging, search sandbox, Flutter CI) with access controls.
    3. Capture outstanding issues/fixes by running discovery workshops to populate the empty issue/fix registers.
    4. Approve blue design tokens, accessibility baselines, and API contract templates.
- **Task 1.2 – Mobile & Web Architecture Baseline**
  - Subtasks:
    1. Define Flutter module structure and React component refactor plan.
    2. Document database migration strategy for profiles, projects, ads, and ledger tables.
    3. Publish integration matrix covering backend, frontend, mobile, provider app, database, API, logic, and design ownership.
  - **Status Update:** Flutter CI/CD infrastructure is live with GitHub Actions enforcing analysis/test gates and Codemagic handling signed release builds, satisfying the shared environment objective for mobile within this milestone.

## Milestone 2: Core Experience Implementation (Weeks 4–7) – 18% Complete
- **Task 2.1 – Flutter Feature Foundations**
  - Subtasks:
    1. Implement authentication, navigation shell, and offline caching across modules.
    2. Deliver chat bubble overlay and inbox parity on mobile.
    3. Integrate live feed list/composer with moderation hooks.
    4. Wire explorer/search UI with Meilisearch sandbox.
- **Task 2.2 – Web Experience Rebuild**
  - Subtasks:
    1. Launch homepage redesign with blue branding and SEO schema.
    2. Deploy floating chat bubble, live feed components, and volunteer/launchpad entry points.
    3. Refactor profile page into component-based layout with new sections and availability toggles.

## Milestone 3: Trust & Automation Delivery (Weeks 8–11) – 61% Complete
- **Task 3.1 – Payments, Disputes & Infrastructure**
  - Subtasks:
    1. Integrate FCA escrow endpoints, ledger, and reconciliation dashboards.
    2. Implement dispute state machine with timers, evidence storage on Cloudflare R2, and notifications.
    3. Harden Cloudflare R2 pipelines for live feed media, ads creatives, and dispute uploads.
- **Task 3.2 – Discovery & Matching Rollout**
  - Subtasks:
    1. Productionise Meilisearch cluster with indexers and analytics instrumentation, including Launchpad/Volunteer-specific ranking rules.
    2. Launch auto-assign engine with acceptance/retry logic, Experience Launchpad eligibility scoring, and availability toggles.
    3. Release Experience Launchpad and Volunteers hub with employer/talent workflows across web, Flutter, and provider dashboards, including reporting on placements and participation.
- **Status Update:** Escrow domain, dispute orchestration, Cloudflare R2 integration, and Trust Center UI are production-ready with operations hand-off complete; discovery automation now has Meilisearch live in staging/production with scripted ingestion. Experience Launchpad workflows shipped with seeded cohorts, readiness scoring APIs, employer/talent intake forms, placements telemetry, and refreshed documentation across backend, frontend, and design assets. The Volunteers Hub has now launched with Sequelize migrations, REST controllers, analytics emitters, React dashboard, and Flutter/provider parity specs covering invitations, commitments, hour logging, and impact reporting, raising milestone completion and unlocking staged beta rollout planning.

## Milestone 4: Operational Excellence & User Archetypes (Weeks 12–14) – 38% Complete
- **Task 4.1 – Profiles, Agencies & Companies**
  - Subtasks:
    1. Deliver trust score calculations, likes/follows counters, and profile component APIs.
    2. Ship agency dashboards (HR, payments distribution, projects/gigs pipeline) across web and mobile.
    3. Ship company dashboards (headhunter, job listings, interview calendar, ATS analytics).
- **Task 4.2 – Project, Gig & Employment Modules**
  - Subtasks:
    1. Release project management module (tasks, milestones, time tracking, in-project chat) with volunteer staffing hooks.
    2. Upgrade gig creation/management and integrate with auto-assign, Experience Launchpad matching, and escrow milestones.
    3. Expand employment/jobs board (screener questions, CV builder/upload, admin panels) covering volunteer listings, launchpad opportunities, and analytics by candidate type.

- **Status Update:** Profile experience now pairs the hardened backend contract with a production-ready React editor drawer that manages experience, qualifications, references, portfolio links, and impact insights while surfacing trust-score breakdown analytics. The trust engine has been recalibrated with Launchpad readiness, volunteer impact, jobs delivery, availability freshness, and compliance weighting, producing a validated 80.15 baseline score with Jest coverage and recommended review cadences that flow into the React insights module. Availability focus areas continue to sync instantly to auto-assign and Launchpad cohorts, and the live profile page presents credential cards plus portfolio evidence, further unblocking agency/company dashboard wiring and lifting Milestone 4 readiness for user archetype analytics. Newly landed analytics instrumentation now emits trust delta, engagement refresh, and targeting funnel events so upcoming agency/company dashboards can ingest live profile readiness signals without additional integration work. The agency finance control tower has moved from concept to production, surfacing revenue, escrow, payout distribution, runway reserves, and export compliance states directly from the FinancePayout batch pipeline—completing Task 5.3b and giving operations the visibility required for milestone sign-off.

## Milestone 5: Stabilisation, Testing & Launch (Weeks 15–18) – 30% Complete
- **Task 5.1 – Quality, Security & Compliance Sign-off**
  - Subtasks:
    1. Execute full regression suite (backend, frontend, Flutter, provider app, API, database migrations, design QA).
    2. Complete security assessments, penetration tests, and FCA compliance documentation.
    3. Validate analytics, monitoring dashboards, and incident runbooks for production readiness.
- **Task 5.2 – Launch Enablement & Hypercare**
  - Subtasks:
    1. Prepare marketing assets, release notes, changelog, and support training materials.
    2. Coordinate phased rollout (dogfood → beta → GA) with rollback plans and feature flags.
    3. Establish hypercare war-room, KPI dashboards, and backlog triage for post-launch iterations.

## Design Update – Additional Milestones (Reference)
- **Foundation & Alignment (Weeks 1–2)**: Establish shared IA, token architecture drafts, and stakeholder alignment across app, web, and provider experiences.
- **Systemisation & Theming (Weeks 3–5)**: Finalise component specifications, deliver dual-theme variants, and publish reusable partial templates.
- **Experience Production (Weeks 6–9)**: Produce high-fidelity journeys for discovery, booking, Launchpad, Volunteers, and monetisation dashboards with responsive layouts.
- **Validation & Launch Readiness (Weeks 10–12)**: Complete accessibility/compliance audits, execute design QA, and ship launch toolkits. Full detail lives in `Design_update_milestone_list.md` and augments the core milestone plan without altering its scope or percentages.
