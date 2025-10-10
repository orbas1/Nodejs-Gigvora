# Version 1.00 – Features Update Plan

## Programme Structure
- **Programme Owner:** VP Product (accountable for scope, budget, and stakeholder alignment).
- **Delivery Leads:** Engineering (Backend, Flutter, Frontend), Compliance, Design, QA, DevOps, Data/Analytics, Product Marketing.
- **Operating Rhythm:** 3 × 4-week programme increments (PIs) plus 4-week launch runway. Weekly executive status review, daily stand-ups per squad, twice-weekly cross-squad sync, monthly risk/RAID review.
- **Governance:** Feature flag strategy for every high-risk module, gated beta cohorts, change advisory board (CAB) for escrow/disputes, design review committee for blue branding, compliance sign-off gates per PI.
- **Documentation Hub:** Confluence master plan, Jira epic tree, Figma design system, Notion playbooks for support/marketing.

## Phase Blueprint
| Phase | Weeks | Objectives | Exit Criteria |
| --- | --- | --- | --- |
| **Discovery & Foundations** | 1–4 | Confirm requirements, map data flows, complete design system, select vendors (escrow, Cloudflare R2, Meilisearch), draft API contracts, migration strategy. | Sign-off on UX/UI, architecture, compliance checklists, and infrastructure provisioning tickets. |
| **Build & Integration** | 5–12 | Develop Flutter app modules, rebuild homepage/website, implement backend services (escrow, disputes, project management, search, ads, launchpad/volunteer), expand profile schema, integrate Cloudflare R2. | Feature-complete stories in staging behind flags, automated tests ≥80% coverage, integration environments stable. |
| **Stabilisation & Launch Prep** | 13–16 | Regression testing, FCA sandbox approval, data migrations, beta programmes, performance tuning, documentation and training, release readiness reviews. | Zero critical defects, compliance/legal sign-off, store builds ready, marketing and support assets approved. |
| **Launch & Hypercare** | 17–18 | Phased rollout, production monitoring, support war-room, KPI tracking, post-launch retrospectives. | KPIs trending to targets, backlog triage complete, transition to BAU support. |

## Workstreams & Detailed Plans
### 1. Product & Design Experience
1. Conduct UX audits for homepage, profiles, search, jobs, live feed, and mobile flows; compile insight report.
2. Define blue brand tokens (palette, typography, spacing, motion) and export to JSON for web and Flutter consumption.
3. Produce Figma wireframes and high-fidelity prototypes for:
   - Web: homepage, dashboards, project management, search explorer, ads suite, profiles, job board, volunteer hub.
   - Mobile (Flutter): onboarding, live feed, chat bubble, search, auto-assign queue, disputes, launchpad, volunteers, ads, profile settings.
4. Run accessibility reviews (WCAG 2.1 AA), localisation checks (LTR/RTL readiness), and stakeholder walkthroughs.
5. Deliver design documentation packages (component specs, interaction notes, analytics tagging guides) to engineering.

### 2. Mobile (Flutter) Delivery
1. Establish Flutter monorepo with modular architecture (feature packages, shared core, service layer) and naming conventions.
2. Implement foundational services: authentication (OAuth/passwordless, MFA), networking (Dio/Retrofit), secure storage, analytics (Segment/Firebase), error logging (Sentry), feature flag handling.
3. Build screen flows per feature set:
   - Messaging: floating bubble overlay, inbox list, conversation detail, support escalation.
   - Live Feed: feed stream, composer, media upload, reactions, share flows.
   - Discovery: search explorer, filter drawer, saved searches, entity detail overlays.
   - Projects/Auto-Assign: project list, detail, timeline, tasks, auto-assignment review queue, accept/decline interactions.
   - Disputes & Escrow: dispute stages, evidence upload, payment actions.
   - Jobs & ATS: job listings, application forms, interview calendar, status tracker.
   - Launchpad/Volunteers: onboarding wizards, matched opportunities, invitations.
   - Gigvora Ads: campaign list, editor, metrics.
4. Add offline caches using Hive/Sqflite for messages, projects, jobs; implement optimistic updates and background sync tasks.
5. Integrate push notifications, deep links, and analytics events; validate device-level performance (cold start ≤3s, frame build <16ms).
6. Configure CI/CD (Codemagic/GitHub Actions) for automated testing (unit, widget, golden), build signing, beta distribution (TestFlight/Play Store Internal).

### 3. Web Frontend Delivery
1. Inject design tokens into React/Tailwind theme; refactor layout primitives to support new blue branding and accessibility.
2. Rebuild homepage with updated storytelling, CTA funnels, SEO schema, and conversion tracking.
3. Implement floating chat bubble, live feed components, volunteer/launchpad entry points, job board dashboards, ads management console.
4. Refactor profile page into component-based architecture; add new sections (agency/company type, qualifications, experience timeline, references, trust score, likes/follows, availability toggles, areas served) with editable blocks.
5. Enhance explorer/search interface with advanced filters, saved searches, real-time counts, and map view.
6. Integrate ATS dashboards, interview scheduler, CV builder, volunteer hub, and ads campaign creation flows.
7. Ensure responsive behaviour across breakpoints, performance budgets (LCP ≤2.5s), and PWA enhancements where applicable.

### 4. Backend & Platform Services
1. **Escrow & Payments**
   - Finalise integration with FCA-compliant provider; configure sandbox accounts.
   - Design ledger schema, transaction reconciliation, payout scheduling, and audit log services.
   - Implement funding, milestone release, partial release, refund/dispute triggers, and reporting endpoints.
2. **Disputes Workflow**
   - Model dispute stages with SLA timers, fee structures, evidence storage in Cloudflare R2, and mediator assignments.
   - Build admin UI APIs for mediation/arbitration, messaging hooks, and outcome enforcement.
3. **Project Management Module**
   - Extend project schema for budgets, tasks, milestones, objectives, time tracking, group chat threads.
   - Build timeline/Gantt services, progress metrics, integration with auto-assign and escrow milestones.
4. **Search & Matching**
   - Deploy Meilisearch cluster; configure indexes for profiles, projects, gigs, jobs, volunteers, ads.
   - Create ingestion pipelines, ranking rules, synonyms, segmentation filters, and analytics logging.
   - Build auto-assign matching service with retry logic, acceptance windows, notifications, and admin controls.
5. **User Archetype Modules**
   - Implement agency/company account types, permissions, HR dashboards, payment distribution workflows, and gig/project pipelines.
   - Deliver employment board endpoints (job postings, applications, screener questions, interview scheduling, ATS stages) and CV storage.
6. **Volunteer & Launchpad Services**
   - Create volunteer registry, availability schedules, invite flows, acceptance tracking, and integration with project/job assignments.
   - Implement launchpad matching algorithms, onboarding criteria management, and performance metrics.
7. **Gigvora Ads**
   - Build campaign entities, budget pacing engine, bidding models, targeting segments, creative storage, conversion tracking, and billing integrations.
8. **Infrastructure & DevOps**
   - Provision Cloudflare R2 buckets, signed URL microservice, CDN configuration, and backup strategy.
   - Enhance observability (Datadog/New Relic dashboards, alerting for latency/errors, escrow transaction health), configure infrastructure-as-code updates, and security scanning pipelines.

### 5. Data, Migration & Analytics
1. Draft migration scripts for profile enhancements, trust score calculation, likes/follows, volunteer flags, launchpad status.
2. Create backfill jobs and data validation scripts; plan phased rollouts to minimise downtime.
3. Implement analytics taxonomy for new events (feed interactions, auto-assign outcomes, ads conversions, volunteer invites).
4. Update data warehouse models and dashboards (Looker/Tableau) to report on new KPIs.
5. Ensure GDPR-compliant data retention, deletion workflows, and consent logging across new modules.

### 6. Compliance, Legal & Risk Management
1. Conduct FCA readiness workshops; document operational processes for escrow, disputes, safeguarding, and chargebacks.
2. Align KYC/KYB provider workflows, data residency policies, and secure storage requirements.
3. Update terms of service, privacy policy, dispute resolution policies, launchpad/volunteer programme agreements.
4. Perform threat modelling, penetration testing, and secure code reviews for payment/search/chat services.
5. Establish incident response runbooks and tabletop exercises for financial and data breaches.

### 7. Quality Assurance & Testing Strategy
1. Define comprehensive test matrix covering functional, regression, usability, accessibility, performance, and security scenarios across web/mobile.
2. Implement automated suites:
   - Backend unit/integration tests, contract tests, load testing (k6/JMeter) for search/ads/escrow.
   - Frontend unit (Jest), integration (React Testing Library), and e2e (Cypress) suites.
   - Flutter unit/widget/golden tests and Appium/Detox e2e scenarios.
3. Build staging & pre-production environments with production-like data; enable feature flag toggles for validation.
4. Run beta programmes: internal dogfood, invite-only user cohorts for live feed, project management, mobile app; collect feedback loops and iterate.
5. Maintain QA scorecards, defect triage cadence, and release readiness checklist with go/no-go gates.

### 8. Release, Training & Change Management
1. Prepare phased rollout plan: internal dogfood → closed beta (10% traffic) → open beta (30%) → general availability with monitoring thresholds.
2. Create training curricula for support, sales, and success teams, including playbooks for escrow/disputes, launchpad, volunteers, ads.
3. Update knowledge base, in-app walkthroughs, onboarding emails, marketing site content, and app store listings.
4. Coordinate marketing campaign (press release, blog, email drips, social) emphasising mobile app launch, compliance, and new user types.
5. Establish hypercare war-room for first 30 days post-launch, with escalation paths and KPI dashboards.

## Milestones & Deliverables
1. **Week 2:** Vendor selections finalised; design tokens approved; infrastructure provisioning kicked off.
2. **Week 4:** UX/UI signed off; API contracts published; compliance checklist baseline completed.
3. **Week 8:** Flutter foundational modules, live feed backend, and escrow MVP in sandbox; homepage redesign in staging.
4. **Week 12:** Profile overhaul, search/auto-assign, project management, ads, volunteer/launchpad features feature-complete across web/mobile; Cloudflare R2 live.
5. **Week 14:** End-to-end integration tests passing; dispute workflow validated; analytics dashboards online.
6. **Week 16:** FCA sign-off received; app store builds submitted; training and documentation ready.
7. **Week 18:** General availability release executed; hypercare metrics within target ranges.

## RACI Snapshot (Critical Streams)
| Workstream | Responsible | Accountable | Consulted | Informed |
| --- | --- | --- | --- | --- |
| Escrow & Disputes | Backend Lead, Compliance Lead | VP Product | Legal, Finance, Support | Exec Team |
| Flutter App | Mobile Lead | VP Engineering | Design, QA | Marketing, Support |
| Live Feed & Search | Frontend Lead, Backend Search Lead | VP Product | Data, Compliance | Sales |
| Profile Overhaul | Frontend Lead | VP Product | Design, Marketing | Support |
| Gigvora Ads | Ads PM, Backend Lead | VP Product | Finance, Legal | Agencies/Partners |
| Launchpad & Volunteers | Product Growth Lead | VP Product | Marketing, Compliance | Community Team |

## Risk Register & Mitigation
- **Regulatory approval delays** → Maintain weekly sync with legal counsel, parallelise technical build with sandbox testing, prepare contingency payment flows.
- **Mobile performance regressions** → Enforce performance budgets, automated profiling in CI, beta device testing across tiers.
- **Search relevance gaps** → Set up continuous relevance tuning, feedback loops, and A/B testing for ranking rules.
- **Data migration errors** → Dry-run migrations, automated rollback scripts, real-time monitoring of key tables.
- **User adoption lag** → Launch guided onboarding, contextual nudges, marketing campaigns, and success KPIs.

## Exit Criteria (Programme Close)
- 100% of feature acceptance tests pass with zero critical defects and ≤5 high severity issues deferred with mitigation.
- FCA compliance documentation signed and escrow/dispute processes audited.
- Performance benchmarks achieved: P95 API <1.5s, web LCP ≤2.5s, mobile cold start ≤3s, chat latency ≤500ms.
- Support, sales, and marketing teams certified on new features; knowledge base articles published.
- Analytics dashboards reporting success metrics and adoption KPIs with data flowing for at least 7 consecutive days post-launch.
