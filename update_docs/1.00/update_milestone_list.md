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

## Milestone 3: Trust & Automation Delivery (Weeks 8–11) – 20% Complete
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

## Milestone 4: Operational Excellence & User Archetypes (Weeks 12–14) – 24% Complete
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
