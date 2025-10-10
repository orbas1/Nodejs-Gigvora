# Version 1.00 – New Feature Brief

## Vision Statement
Version 1.00 ushers Gigvora into a fully unified, mobile-first work marketplace spanning web and Flutter-powered phone experiences. The release completes our end-to-end product loop by launching a polished mobile application, rebuilding critical web flows, and delivering scalable infrastructure and compliance upgrades. Every feature in this brief aligns with three guiding pillars:

1. **Frictionless collaboration** between freelancers, agencies, companies, and volunteers.
2. **Regulatory trust and financial safety** for UK and international clients through FCA-compliant escrow and dispute management.
3. **Engaging, data-rich experiences** across web and mobile that rival LinkedIn, Upwork, and industry-leading ATS platforms.

## Core Outcomes
- Deliver a production-ready Flutter application that mirrors and enhances web capabilities with shared APIs, secure authentication, and native-feeling UX.
- Modernise the Gigvora brand with a blue-themed redesign across homepage, responsive web, and native mobile layouts.
- Launch a community-grade live feed, powerful discovery tooling, and targeted Gigvora Ads to drive repeat engagement and monetisation.
- Ship compliance-validated escrow, dispute, and project management workflows to de-risk client spending and freelancer earnings.
- Expand profile depth, employment offerings, and launch pads that support every stage of a talent journey.

## Feature Streams
### 1. Platform-Wide Mobile Readiness
- **Flutter App**: Single codebase for iOS/Android with modular screens for onboarding, project browsing, live feed, inbox, and account management.
- **Mobile Upgrade & Design Recreation**: Implement new blue brand language, responsive typography, and a system of reusable components to deliver pixel parity with the web redesign.
- **Phone App Integration Hooks**: Define REST/GraphQL endpoints, authentication guards, push notification channels (Firebase Cloud Messaging), and offline caching for job boards, chat, projects, and ads.

### 2. Communication & Engagement
- **Floating Chat Bubble**: Persistent component in both web and mobile surfaces, enabling users to jump from live feed to direct messages or support in one tap.
- **Inbox Enhancements**: Threaded messaging, read receipts, quick replies, and escalation path to live support.
- **Live Feed**: Real-time stream supporting posts, media attachments, shares (gigs, projects, companies, volunteers), reactions (like/comment/share), and follow mechanics.

### 3. Trust, Compliance & Transactions
- **FCA-Compliant Escrow**: Partner with compliant payment processor, integrate tiered verification (KYC/KYB), escrow state machine (funded, in-progress, released, disputed), and transparent ledger.
- **Disputes Upgrade**: Multi-stage flow (Start-up → Offers → Mediation → Arbitration) with evidence uploads, timers, and fee handling.
- **Project Management Module**: Budget tracking, milestone releases, hourly time logging, group chat per project, agency escalation, and reporting dashboards.

### 4. Discovery, Matching & Automation
- **Explorer & Search**: Deploy Meilisearch-backed index with LinkedIn-level filtering (skills, industry, rates, location, availability toggles) and weighting for launchpad or volunteer status.
- **Freelance Auto-Assign**: Rules engine that queues available freelancers by rating, area, language, hourly rate, and review thresholds, with accept/decline lifecycle.
- **Experience Launchpad & Volunteers**: Automated matching pool for early career talent and socially-driven volunteering marketplace with invitation flows and acceptance gating.

### 5. User Archetypes & Profiles
- **Profile Upgrade**: Introduce sections for agency/company type, qualifications, experience, references, trust score, likes/follows, and component-based layout that adapts to web/mobile.
- **Agency & Company User Types**: Dedicated dashboards for HR, payments distribution, gig/project pipelines, ATS integration, and analytics.
- **Employment/Jobs Board**: Full ATS pipeline (job setup, screener questions, application stages, interview calendar), profile CV builder/upload, and admin oversight.

### 6. Monetisation & Infrastructure
- **Gigvora Ads Suite**: Campaign builder supporting geographic targeting, PPC/CPC/CPM models, budgets, scheduling, creatives, placement rules, and performance analytics.
- **Cloudflare R2 Adoption**: Asset storage, CDN acceleration, signed URL delivery, and disaster recovery policies for media-heavy features (feed posts, profiles, ads).
- **Scalable Architecture**: Update backend services to support expanded APIs, event-driven notifications, and analytics instrumentation across new modules.

## Success Metrics
- ≥95% of web features accessible in the Flutter app with ≤1 second navigation latency on mid-tier devices.
- 30% increase in user-to-user interactions (messages, live feed engagement) within the first quarter post-launch.
- 0 unresolved FCA compliance gaps identified by external audit; 100% of escrow disbursements logged.
- ≥90% profile completion rate driven by new sections and trust indicators.
- Launchpad placements filling ≥60% of eligible entry-level roles within 14 days.

## Dependencies & Risks
- **Regulatory**: FCA escrow must undergo legal review and sandbox testing prior to general availability.
- **Data Migration**: Profile schema changes require carefully sequenced migrations, backfilling of legacy data, and opt-in experiences.
- **Infrastructure**: Meilisearch, Cloudflare R2, and new event streams must be provisioned with redundancy and monitoring (Datadog/New Relic).
- **Change Management**: Extensive UI changes demand updated design systems, documentation, QA scripts, and onboarding materials for support teams.

## Next Steps
- Finalise UX wireframes and design tokens for the blue rebrand across web and mobile.
- Lock payment/escrow vendor contracts and initiate compliance audit checklists.
- Prepare API contract updates for chat, search, project management, ads, and ATS modules.
- Schedule cross-team kick-off covering backend, Flutter, frontend, compliance, QA, and DevOps.
- Align release communications plan highlighting Version 1.00’s upgraded value proposition to all user segments.
