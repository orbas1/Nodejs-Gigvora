# Version 1.00 – New Feature Brief

## Vision Statement
Version 1.00 transforms Gigvora into a fully connected, compliance-assured work marketplace where mobile, web, and operational teams ship in lockstep. The release completes the end-to-end loop for freelancers, agencies, companies, volunteers, and job seekers by delivering:

- A **production-ready Flutter application** with feature parity across inbox, live feed, discovery, projects, ads, and financial operations.
- A **blue-branded design refresh** that reimagines homepage, responsive web, and mobile layouts while preserving accessibility, conversion, and SEO strength.
- A **compliance-forward transaction backbone** featuring FCA-aligned escrow, staged disputes, and automated project governance.
- A **career lifecycle platform** that nurtures users from entry-level launchpad to agency and company scale, supported by robust profiles, ATS, and ads monetisation.

## Strategic Pillars
1. **Omnichannel Collaboration:** Persistent communication, live feed engagement, and auto-assignment to keep workstreams moving in real time.
2. **Trust & Compliance:** FCA-compliant payments, auditable disputes, trust scoring, and Cloudflare-backed storage safeguarding user data.
3. **Discovery & Growth:** LinkedIn-grade search, curated launchpads, volunteer ecosystems, and Gigvora Ads to power growth loops.

## Feature Portfolio Overview
| Stream | Key Deliverables | Primary Users | Success Criteria |
| --- | --- | --- | --- |
| Mobile & Experience | Flutter app, blue UI kit, mobile-first homepage | All segments | ≥95% feature parity vs web, app store readiness |
| Transactions & Compliance | FCA escrow, staged disputes, Cloudflare R2 | Clients, finance, legal | 0 audit blockers, full ledger traceability |
| Collaboration & Engagement | Floating chat bubble, inbox upgrade, live feed | Freelancers, agencies, support | +30% engagement, CSAT ≥4.5/5 |
| Discovery & Automation | Meilisearch explorer, auto-assign, launchpad | Companies, agencies, job seekers | 60% faster matching, ≥50% launchpad fills |
| Profiles & User Types | Profile overhaul, agency/company modules, ATS | All account types | 90% profile completion, ATS adoption >40% |
| Monetisation & Ads | Gigvora Ads suite, volunteer/ads linking | Marketing, companies | Ads revenue contribution ≥15% of GMV |

## Core Outcomes & Capabilities
### 1. Platform-Wide Mobile Readiness
- **Flutter App Delivery**: Modular architecture (auth, feed, chat, discovery, projects, ads) with Bloc/Provider state management, offline caches, deep links, and Firebase Cloud Messaging.
- **Mobile Design Recreation**: Blue theming, dynamic typography, accessibility contrast ratios, and animation guidelines to match web redesign.
- **Phone App Integration**: Defined API contracts, GraphQL fragments, pagination, optimistic updates, and golden test suites.

### 2. Communication & Community Engagement
- **Floating Chat Bubble & Inbox Upgrade**: Draggable bubble on web/mobile, multi-thread inbox, quick replies, support escalation, attachment handling, and transcript retention.
- **Live Feed (LinkedIn-inspired)**: Rich post composer, media galleries, polls, share to gigs/projects/companies/volunteers, follow/like/comment/share interactions, moderation tools, and analytics instrumentation.

### 3. Trust, Payments & Governance
- **FCA-Compliant Escrow**: Partnership with FCA-regulated provider, KYC/KYB flows, escrow state machine (funded → in progress → released → disputed), double-entry ledger, and reconciliation dashboards.
- **Disputes Upgrade**: Startup → Offers → Mediation → Arbitration stages with timers, partial payment handling, arbitration fee capture, and case assignment tooling.
- **Project Management Module**: Budgets, milestones, timelines, tasks, OKRs, hourly tracking, in-project chat, group/agency escalation, and progress analytics.

### 4. Discovery, Matching & Automation
- **Explorer & Search**: Meilisearch-backed indexes with LinkedIn-level filtering (skills, industries, rates, availability toggles, trust score, geography) and saved search alerts.
- **Freelance Auto-Assign**: Rules-based matching engine that queues available freelancers using rating, area, language, hourly rate, review counts, and auto-reassign until acceptance.
- **Experience Launchpad & Volunteers**: Dedicated onboarding, criteria-driven matching, auto scheduling/invitations, and dashboards for both talent and organisers.

### 5. User Archetypes & Profiles
- **Profile Upgrade**: Component-based layout with sections for agency/company type, qualifications, experience timeline, references, trust score, likes, followers/following, areas served, and availability toggles.
- **Agency & Company User Types**: Dashboards for HR management, payments distribution, project/gig oversight, ATS, headhunter tooling, analytics, and integrations with calendars and HRIS exports.
- **Employment & Jobs Board**: Full ATS pipeline, screener questions, CV builder/upload, interview calendar, admin moderation, and candidate scoring.

### 6. Monetisation, Infrastructure & Brand
- **Gigvora Ads Suite**: Campaign creation (PPC/CPC/CPM), geographic targeting, budget pacing, creatives management, placement rules, and reporting dashboards.
- **Cloudflare R2 Integration**: Storage buckets segmented by media type, signed URLs, lifecycle policies, CDN acceleration, and disaster recovery runbooks.
- **Homepage & Website Blue Rebrand**: Hero narratives, testimonials, CTA funnels, responsive layouts, SEO optimisations, and mobile parity.

## Success Metrics
- **Mobile & UX**: P95 navigation latency ≤1s on mid-tier Android; app crash-free sessions ≥99%. 20% uplift in homepage conversion to sign-up.
- **Collaboration**: +30% quarter-over-quarter increase in messages, feed interactions, and project acceptance via auto-assign.
- **Compliance**: Zero outstanding FCA audit issues; 100% escrow transactions reconciled daily; disputes resolved within SLA targets.
- **Adoption**: 90% profile completion post-upgrade; 50% of agencies activating HR dashboards; 40% of employers using ATS features within 60 days.
- **Growth**: Launchpad fills ≥60% of entry-level roles within 14 days; Volunteer invitations accepted ≥45% of the time.

## Dependencies & Risks
- **Regulatory**: Escrow and dispute flows require legal review, FCA sandbox testing, and documented audit trails before GA.
- **Infrastructure**: Meilisearch scaling, Cloudflare R2 migration, and event-driven notifications must be provisioned with redundancy and monitoring (Datadog/New Relic).
- **Data Migration**: Profile schema refactor demands sequenced migrations, backfills, and backward-compatible APIs.
- **Change Management**: Extensive UI shifts require updated documentation, support training, and comms for users across web and mobile.
- **Security**: Expanded APIs and ads platform increase attack surface; penetration testing and secure SDLC gating are mandatory.

## Next Steps & Alignment
1. Finalise Figma design system, interaction specs, and accessibility audits for web/mobile.
2. Lock escrow/payment vendor agreements and initiate compliance documentation workflows.
3. Define API contracts for chat, search, project management, launchpad, volunteers, ads, and ATS modules; publish SDK updates.
4. Stand up Flutter CI/CD (Codemagic/GitHub Actions) and backend deployment pipelines with staging parity.
5. Schedule cross-squad programme kickoff covering engineering, design, compliance, marketing, QA, and support.
6. Craft release communications and onboarding materials highlighting Version 1.00 value propositions and support readiness.
