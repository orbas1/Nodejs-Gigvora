# Version 1.00 – Features to Add

## Platform Foundations
1. **Flutter Mobile Application (iOS & Android)**
   - **Core Screens:** Onboarding, authentication (passwordless + MFA), dashboard, live feed, explorer/search, project management, gig/job listings, chat/inbox, ads manager, profile settings.
   - **Navigation & Architecture:** Modular feature packages, Bloc/Provider state management, background sync, deep linking, and push notification handling.
   - **API Contracts:** REST/GraphQL endpoints for authentication, feed, chat, search, payments, projects, ATS, and ads. Requires pagination, filtering, and offline caching strategies.

2. **Mobile Upgrade & Blue Design System**
   - **Design Tokens:** Palette (`Gigvora Blue #0A5BE0`, gradients), typography scale, spacing, shadows shared across web and mobile.
   - **Component Library:** Buttons, cards, modals, badges, availability toggles, media uploaders with motion specs and accessibility annotations.
   - **Responsive Assets:** SVG/icon set, illustration refresh, and dark-mode variants aligned with new brand.

3. **Cloudflare R2 Integration**
   - **Storage Buckets:** Segmented for profiles, feed media, ads creatives, dispute evidence.
   - **APIs & Security:** Signed URL service, lifecycle policies (archival/retention), encryption at rest, CDN configuration.
   - **Tooling:** Upload widgets, background workers for image optimisation and video transcoding.

## Collaboration & Communication
4. **Chat & Inbox Upgrade with Floating Bubble**
   - **Features:** Persistent floating bubble on web/mobile, context switching to support or project chats, typing indicators, read receipts, quick action shortcuts.
   - **Tech Requirements:** WebSocket messaging service, queue-backed push notifications, escalation API to support team, chat transcript storage on R2.
   - **Mobile Tie-In:** Native overlay in Flutter with draggable positioning and offline draft support.

5. **Project Management Suite**
   - **Modules:** Budgets, milestones, tasks (with assignments, deadlines, dependencies), objectives/OKRs, hourly tracking (timer + manual entry), progress reporting, in-project chat, group project spaces, agency escalation.
   - **Data Model Additions:** `projects`, `project_tasks`, `project_objectives`, `project_milestones`, `time_logs`, `project_members`, `project_chat_threads` tables.
   - **Functionalities:** Gantt/timeline views, dashboard metrics, export to CSV/PDF, integration with escrow milestones.

6. **Disputes Workflow Revamp**
   - **Stages:** Startup (evidence submission), Offers (partial refund proposals), Mediation (triage with mediator), Arbitration (fee-backed binding resolution).
   - **System Needs:** Stage timers, notification matrix, arbitration fee processing, dispute audit logs, mediator tooling UI, outcome recording.
   - **Mobile Experience:** Dedicated screens for dispute status, evidence upload (camera/gallery), and offer responses.

7. **Live Feed Ecosystem**
   - **Content Types:** Text posts, media galleries, documents, shares (gigs, projects, companies, volunteers), polls.
   - **Engagement:** Follow, like, comment threads, share to inbox, bookmarking, reporting/flagging.
   - **Infrastructure:** Feed aggregation service, ranking algorithm, caching, moderation queue, analytics events.

## Discovery, Matching & Automation
8. **Explorer & Search 2.0**
   - **Engine:** Meilisearch deployment with synonyms, typo tolerance, and segmentation indices for profiles, projects, gigs, companies, volunteers, ads.
   - **Filters:** Industry, skills, languages, rate, availability toggles, trust score thresholds, launchpad/volunteer flags, compliance status.
   - **Interface:** Saved searches, alert subscriptions, inline previews, map view for geographic targeting.
   - **Mobile Alignment:** Flutter screens mirroring filters, plus quick actions for voice search and biometric login shortcuts.

9. **Freelance Auto-Assign Engine**
   - **Workflow:** Opt-in toggle during project creation, ranking queue of available freelancers based on rating, area, language, hourly rate, reviews.
   - **Rules & Controls:** Accept/decline windows, fallback escalation, logging, manual override by project owner.
   - **Integrations:** Notifications (push/email), project management sync, analytics for fill rates, API endpoints for third-party triggers.

10. **Experience Launchpad**
    - **Purpose:** Marketplace for early-career talent with curated low-risk gigs and jobs.
    - **Features:** Employer criteria setup (skills, education, area), automatic matching pipeline, onboarding wizard for new freelancers/job seekers, interview auto-scheduling for matched roles.
    - **Automation:** Auto project/job assignment when criteria met, status dashboards, educational content modules, satisfaction survey loop.

11. **Volunteers Hub**
    - **Capabilities:** Volunteer listing pages, invite workflows, acceptance/rejection handling, integration with project/job flows once accepted.
    - **Data Extensions:** Flags on profiles, volunteer availability schedules, cause categories, hours tracking for impact reports.
    - **Mobile Delivery:** Volunteer tab in app with push alerts for relevant invitations.

## User Types & Profiles
12. **Profile Overhaul**
    - **Sections:** Agency type, company type, qualifications, experience timeline, references (employer-verified), trust score (calculated from verification, reviews, completion rates), likes, followers/following, availability toggles, areas served.
    - **Design:** Component-based layout with widgets that can be reused on mobile and web; editable blocks with draft mode.
    - **Backend:** Schema updates for new attributes, analytics events for interactions, privacy controls, GraphQL fragments for modular fetching.

13. **Agency User Type**
    - **Dashboards:** HR tools (talent roster, utilisation), payment distribution (split invoicing), project & gig pipelines, resource planning.
    - **Features:** Agency project type with team assignments, graduate-to-agency conversion from freelancer teams, internal messaging, KPI reports.
    - **APIs:** Agency roles/permissions, payout rules, bulk invite/import endpoints, integration with project management suite.

14. **Company User Type**
    - **Functions:** Headhunter management, job listing builder, project oversight, ATS analytics.
    - **Modules:** Hiring team collaboration, approvals workflow, interview scheduling, vendor management.
    - **Integrations:** Calendar (Google/Microsoft), HRIS exports, compliance checks for company verification.

15. **Employment / Jobs Board Expansion**
    - **Features:** Full job detail pages, application forms with screener questions, stage-based ATS pipeline, dashboards for applicants, admin oversight for moderation.
    - **Profile Enhancements:** CV builder (template-driven) or upload, portfolio attachments, cover letter templates.
    - **Supporting Tools:** Interview calendar with reminders, candidate scoring, analytics, API endpoints for job posting automation.

## Commerce & Monetisation
16. **FCA-Compliant Escrow System**
    - **Components:** Escrow accounts (client, freelancer, platform fees), compliance checks (KYC/KYB), ledger tracking, dispute hooks, release/partial release flows.
    - **Security:** Two-factor approvals, audit logs, reconciliation dashboards, automated reporting to finance team.
    - **Mobile Support:** Funding, milestone tracking, release actions, and dispute initiation from Flutter app.

17. **Gigvora Ads Suite**
    - **Campaign Types:** PPC, CPC, CPM with geographic targeting, audience filters, and scheduling.
    - **Tools:** Creative builder (image/video uploads, copy suggestions), budget pacing, bid adjustments, conversion tracking, upsell prompts within project/job flows.
    - **Analytics:** Dashboards for impressions, clicks, conversions, cost metrics, predictive spend estimates.

## Additional Enhancements
18. **Homepage & Website Redesign**
    - **Scope:** Rebuild hero, solution overview, testimonials, CTA zones, footer; apply blue branding across layout system.
    - **SEO/Content:** Structured data, improved page speed, new illustrations, accessibility compliance.
    - **Conversion Hooks:** Inline lead capture, live feed preview, app download prompts.

19. **Mobile Design Recreation**
    - **Elements:** Flutter theming, reimagined navigation (tab + floating actions), motion guidelines, adaptive layout for tablets.
    - **Assets:** Animation library, onboarding walkthroughs, contextual tooltips.

20. **Profile Status Toggles**
    - **Controls:** Online, looking for work, available to freelance – multi-select toggles with automation rules.
    - **System Logic:** Impact search ranking, trigger notifications, update live feed presence badges.
    - **Mobile/Web Sync:** Real-time updates via presence service; user preferences stored server-side.

21. **Explorer-Level Search Enhancements for Mobile**
    - **Screens:** Dedicated explorer, saved searches, results list, detail overlays.
    - **Actions:** Apply filters, follow entities, trigger chat, bookmark, or share directly from search results.
    - **APIs:** Sync with Meilisearch queries, offline cache of last results, instrumentation for search analytics.

22. **Auto Assign & Launchpad Mobile Coverage**
    - **Screens:** Project auto-assign toggle, assignment review queue, launchpad onboarding, matched opportunities list.
    - **Actions:** Accept/decline, request info, escalate to support.
    - **APIs:** Reuse matching service endpoints, push notifications, event tracking for conversion funnels.

23. **Volunteer & Ads Integration in App**
    - **Volunteer Screens:** Discovery, invites, accepted opportunities, history/logging.
    - **Ads Screens:** Campaign list, editor, performance dashboards, billing preferences, alert setup.
    - **Cross-Feature Hooks:** Ability to promote volunteer initiatives via ads, share volunteer wins in live feed.
