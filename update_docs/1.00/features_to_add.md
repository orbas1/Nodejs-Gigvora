# Version 1.00 – Features to Add

## Executive Summary Table
| Feature Cluster | Major Deliverables | Key Users | Integration Touchpoints |
| --- | --- | --- | --- |
| Mobile Platform | Flutter app, blue design system, phone integrations | All users | REST/GraphQL APIs, Firebase, Cloudflare R2 |
| Collaboration & Community | Floating chat bubble, inbox upgrade, live feed | Freelancers, agencies, support | Messaging service, notifications, moderation tools |
| Trust & Transactions | FCA escrow, disputes revamp, project management | Clients, finance, freelancers | Payments provider, ledger DB, Cloudflare R2 |
| Discovery & Automation | Meilisearch explorer, auto-assign, launchpad, volunteers | Companies, agencies, job seekers | Search engine, rules engine, analytics |
| Profiles & User Types | Profile overhaul, agency/company modules, ATS, status toggles | All account types | Profile schema, permissions, HRIS integrations |
| Monetisation & Infra | Gigvora Ads suite, homepage/web redesign, Cloudflare R2 | Marketing, companies | Billing, analytics, CDN |

---

## 1. Mobile Platform Foundations
### 1.1 Flutter Mobile Application (iOS & Android)
- **Screens & Navigation**
  | Module | Screens | Key Widgets/Components |
  | --- | --- | --- |
  | Authentication | Welcome, login/signup (passwordless + MFA), onboarding wizard | Animated hero, stepper, social auth buttons |
  | Dashboard | Home overview, quick actions, notifications | Metrics cards, CTA tiles, presence indicators |
  | Live Feed | Feed list, post detail, composer, media gallery | Infinite list, reaction bar, poll widget, share drawer |
  | Explorer/Search | Results grid/list, advanced filters, saved searches, entity detail overlays | Filter chips, map view, tags, follow buttons |
  | Projects & Auto-Assign | Project list, timeline, tasks, auto-assign queue | Kanban, gantt preview, accept/decline modal |
  | Chat & Support | Inbox list, conversation detail, support escalation | Floating chat bubble overlay, quick reply chips |
  | Jobs & ATS | Job listings, application form, status tracker, interview calendar | Multi-step form, calendar picker, document uploader |
  | Launchpad & Volunteers | Onboarding, matched opportunities, invitations | Criteria checklist, opportunity cards, accept/reject sheet |
  | Gigvora Ads | Campaign list, campaign editor, metrics dashboard | Budget slider, creative preview, KPI charts |
  | Profile & Settings | Profile overview, edit sections, status toggles, trust score | Component cards, progress tracker, toggle controls |
- **Architecture & Utilities**: Modular packages (auth, feed, messaging, search, payments, ads), Bloc/Provider state management, Dio/Retrofit networking, GraphQL client, secure storage, feature flag service, analytics (Segment/Firebase), error logging (Sentry).
- **API Integration**: REST/GraphQL endpoints for chat, feed, search, projects, jobs, escrow, ads, volunteers, launchpad; JSON:API or GraphQL pagination; offline caching (Hive/Sqflite) and background sync.
- **Testing & Quality**: Unit/widget/golden tests, integration tests, end-to-end flows with Appium, accessibility audits, performance profiling (<16ms frame build, cold start ≤3s).

### 1.2 Blue Design System & Mobile Upgrade
- **Design Tokens**: Colour palette (Gigvora Blue #0A5BE0 gradients, secondary neutrals), typography scale, spacing, elevation, motion curves exported for Flutter and React.
- **Component Library**: Buttons, cards, modals, forms, badges, availability toggles, presence indicators, charts, navigation bars, skeleton loaders, empty states.
- **Asset Refresh**: SVG icon set, illustrations, animations (Lottie), onboarding walkthrough, contextual tooltips, dark mode variants.

### 1.3 Phone App Integration
- **APIs**: Authentication guards, push notification service, search/auto-assign endpoints, ads billing endpoints.
- **Pages/Screens**: Mirror web functionality with adaptive layouts for tablets, integrate dynamic links for shared feed posts.
- **Actions**: Accept/reject projects, escalate disputes, share posts, toggle availability, edit profile sections, manage ad campaigns.

---

## 2. Collaboration & Community
### 2.1 Chat & Inbox Upgrade with Floating Bubble
- **Functional Enhancements**: Draggable floating chat bubble across web/mobile, multi-thread inbox, quick replies, read receipts, typing indicators, support channel escalation.
- **Backend/Infrastructure**: WebSocket messaging service, queue-backed push notifications, transcript archival on Cloudflare R2, SLA tracking.
- **Mobile Implementation**: Overlay widget with position memory, offline draft support, message retries.

### 2.2 Live Feed Ecosystem
- **Content Types**: Text, images, videos, documents, polls, shares of gigs/projects/companies/volunteers, achievements.
- **Interactions**: Follow/unfollow, like, comment threads, share to inbox, bookmark, report/flag, trending algorithms.
- **Supporting Services**: Feed aggregation, ranking algorithm, moderation queue, analytics events, CDN-optimised media delivery.

---

## 3. Trust, Transactions & Governance
### 3.1 FCA-Compliant Escrow System
- **Components**: Client/freelancer escrow accounts, platform fee management, KYC/KYB verification workflows, double-entry ledger, reconciliation dashboards, audit logs.
- **User Journeys**: Fund project milestones, track escrow status, partial releases, initiate disputes, view payment history.
- **Compliance**: FCA sandbox testing, multi-factor approvals, daily reconciliation, secure data residency, reporting exports.

### 3.2 Disputes Workflow Revamp
- **Stages**: Startup (evidence upload), Offers (partial refund negotiations), Mediation (mediator facilitation), Arbitration (fee-backed final decision).
- **Features**: Timers with reminders, evidence management, fee collection, mediator dashboards, resolution outcomes, analytics.
- **Phone App Integration**: Dispute overview screen, stage progression, evidence capture via camera/gallery, push alerts.

### 3.3 Project Management Module
- **Core Modules**: Budgets, milestones, interactive timeline/Gantt creation (with templates and scenario planning) for freelancers and agencies, tasks (with dependencies), objectives/OKRs, hourly tracking (timer & manual logs), progress analytics, in-project chat, group/agency projects, workload views.
- **Agency Collaboration**: Task delegation queues, project handoff flows, and workload forecasting dashboards for agency owners to assign or reassign deliverables to specific staff members; allow multiple agency contributors to be attached to a single project with visibility controls.
- **Compensation Management**: Pay split configuration per project/milestone with contributor percentages, approval workflows, and payout sync to escrow milestones.
- **Data Model Additions**: `projects`, `project_members`, `project_roles`, `project_tasks`, `task_dependencies`, `milestones`, `time_logs`, `project_objectives`, `project_chat_threads`, `agency_project_members`, `agency_task_assignments`, `project_contributor_splits`, `project_gantt_snapshots` tables.
- **Integrations**: Escrow milestones, auto-assign engine, notifications, analytics dashboards, export to CSV/PDF, agency roster and utilisation services.

---

## 4. Discovery, Matching & Automation
### 4.1 Explorer & Search (Meilisearch)
- **Engine Setup**: Meilisearch cluster, synonyms, typo tolerance, segmentation indices for profiles/projects/gigs/jobs/volunteers/ads.
- **Filters & Targeting**: Industry, skills, languages, rates, availability, trust score, location radius, launchpad status, volunteer flags, company/agency types.
- **Interfaces**: Saved searches with alert subscriptions, inline previews, geo-bounded map view, facet drawers, voice search (mobile), and quick actions (follow, chat, share).
- **Phone App Coverage**: Dedicated screens, filter drawers, offline caching, analytics instrumentation.

### 4.2 Freelance Auto-Assign Engine
- **Workflow**: Opt-in toggle during project creation, ranking queue based on rating, area, language, hourly rate, review count, availability status.
- **Controls**: Accept/decline timers, fallback routing, manual override, audit logs, notifications (push/email/in-app).
- **Mobile Integration**: Assignment queue screen, accept/reject interactions, escalation to support.

### 4.3 Experience Launchpad
- **Employer Tools**: Criteria setup (skills, education, area), job/project submission wizard, low-risk compensation guidance.
- **Talent Experience**: Launchpad onboarding, skill verification, auto-matching to opportunities, interview scheduling triggers, educational content.
- **Automation**: Match scoring, auto project/job assignment, satisfaction surveys, performance dashboards.

### 4.4 Volunteers Hub
- **Features**: Volunteer profiles, availability schedules, cause categories, invite flows, acceptance/rejection handling, impact hours tracking.
- **Integration**: Project/job pipelines, live feed sharing, ads upsell for volunteer initiatives, analytics tracking.
- **Phone App**: Volunteer tab, push alerts, history log, share to feed.

---

## 5. Profiles, User Types & Employment
### 5.1 Profile Overhaul
- **New Sections**: Agency type, company type, qualifications, experience timeline, references (employer-verified), trust score, likes, follows/followers counts, areas served, availability toggles (online, looking for work, available to freelance).
- **Component-Based Layout**: Reusable widgets for web/mobile, drag-and-drop ordering, draft mode, quick edit modals.
- **Backend Enhancements**: Schema extensions, trust score algorithm, verification logs, GraphQL fragments, privacy controls.

### 5.2 Agency User Type
- **Dashboard Modules**: Human resources roster, utilisation analytics, payments distribution (split invoicing), project/gig pipeline, resource planning, graduate-to-agency conversions, dedicated project management workspace with Kanban, Gantt, and workload dashboards.
- **Task & Project Operations**: Create and manage task backlogs, delegate tasks to agency members, pass entire projects or milestones between staff, and monitor completion status with alerts when workloads exceed capacity.
- **APIs & Permissions**: Role-based access, bulk invites/imports, payment rules, integration with project management and auto-assign, enforcement of task delegation rights, project reassignment audit trails, and pay split governance for contributors.
- **Mobile Support**: Agency overview, team assignments, approvals, notifications, and mobile task acceptance/delegation flows.

### 5.3 Company User Type
- **Functions**: Headhunter management, job listing builder, project oversight, vendor management.
- **ATS & Interview Integration**: Interview scheduling (Google/Microsoft calendar integration) backed by the platform's native full-HD video service, collaborative interview checklists/scorecards that allow multiple company members to join and score in real time, Kanban-style stage boards for the full interview pipeline, and automated recording/notes capture.
- **Mobile Screens**: Hiring overview, candidate pipeline, interview calendar with join video actions, notifications, and real-time interview collaboration alerts.

### 5.4 Employment / Jobs Board Expansion
- **Job Lifecycle**: Job creation wizard, screener questions setup, stage-based ATS pipeline, dashboard for recruiters, admin moderation tools.
- **Candidate Experience**: Application forms, CV builder (template-driven) or upload, cover letter templates, interview scheduling, status updates.
- **Data & Integrations**: ATS analytics, export to HRIS, CV attachments stored in Cloudflare R2, mobile parity.

### 5.5 Profile Status Toggles
- **Controls**: Online, looking for work, available to freelance – multi-select toggles with automation rules affecting search ranking and notifications.
- **System Logic**: Presence service, status audit log, analytics tracking, automatic expiry/reminders.
- **Mobile/Web Sync**: Real-time updates, UI badges, push/email alerts.

---

## 6. Monetisation, Brand & Infrastructure
### 6.1 Gigvora Ads Suite
- **Campaign Types**: PPC, CPC, CPM with geographic targeting, demographic/skill filters, scheduling windows, ad placements (feed, search, profile, dashboard banners).
- **Creation Workflow**: Campaign wizard, creative upload (image/video), copy suggestions, budget pacing, bid adjustments, audience preview, review/approval flow.
- **Metrics & Reporting**: Impressions, clicks, conversions, cost metrics (CPA, CPC, CPM), predictive spend, A/B testing, alerting, export options.
- **Integration**: Billing provider, analytics events, ability to promote volunteer initiatives or launchpad roles.

### 6.2 Homepage & Website Blue Rebrand
- **Scope**: Hero redesign, solution overview, testimonials, CTA zones, footer, navigation, responsive layout, SEO schema, structured data, performance optimisations.
- **Content Hooks**: Live feed preview, mobile app download prompts, trust indicators, compliance messaging, case studies.
- **Accessibility & Performance**: WCAG 2.1 AA compliance, LCP ≤2.5s, CLS ≤0.1, responsive imagery, lazy loading.

### 6.3 Cloudflare R2 Integration
- **Storage Strategy**: Segmented buckets for profile media, feed posts, ads creatives, dispute evidence, volunteer/launchpad documents.
- **Security & Access**: Signed URL service, lifecycle policies (standard, infrequent access, archival), encryption at rest, MFA for admin access.
- **Tooling**: Upload widgets, background workers for image optimisation/video transcoding, monitoring alerts, cost dashboards.

---

## 7. Supporting Tables & Functions
| Table/Service | Purpose | Key Fields / Functions |
| --- | --- | --- |
| `user_profiles` (extended) | Store new profile data | `agency_type`, `company_type`, `qualifications`, `experience_entries`, `trust_score`, `likes_count`, `followers_count`, `areas`, `status_flags` |
| `references` | Employer-verified references | `reference_id`, `user_id`, `employer_id`, `rating`, `comments`, `status` |
| `launchpad_matches` | Track launchpad auto-matching | `match_id`, `candidate_id`, `opportunity_id`, `score`, `status`, `notified_at` |
| `volunteer_invitations` | Manage volunteer invites | `invite_id`, `volunteer_id`, `project_id`, `status`, `responded_at` |
| `ads_campaigns` | Manage ad campaigns | `campaign_id`, `owner_id`, `type`, `budget`, `bid`, `targeting`, `status`, `metrics` |
| `escrow_transactions` | Ledger for FCA compliance | `transaction_id`, `project_id`, `state`, `amount`, `fee`, `released_at`, `disputed_at` |
| `disputes` | Multi-stage dispute records | `dispute_id`, `project_id`, `stage`, `timer_end`, `fee_due`, `mediator_id`, `resolution` |
| `project_tasks` | Project management tasks | `task_id`, `project_id`, `assignee_id`, `status`, `due_date`, `dependency_ids` |
| `agency_project_members` | Manage multi-staff participation on agency projects | `agency_project_member_id`, `project_id`, `agency_user_id`, `role`, `permissions`, `workload_capacity` |
| `agency_task_assignments` | Track delegated agency tasks | `assignment_id`, `task_id`, `assigned_by`, `assigned_to`, `delegated_at`, `status` |
| `project_contributor_splits` | Configure and track pay splits | `split_id`, `project_id`, `milestone_id`, `user_id`, `percentage`, `effective_from`, `approved_by` |
| `project_gantt_snapshots` | Store Gantt chart planning states | `snapshot_id`, `project_id`, `created_by`, `timeline`, `workload_allocation`, `scenario_label` |
| `interview_video_sessions` | Manage native interview video rooms | `session_id`, `interview_schedule_id`, `workspace_id`, `resolution`, `recording_url`, `participant_ids` |
| `interview_checklists` | Collaborative interview criteria | `checklist_id`, `workspace_id`, `stage`, `criteria`, `scoring_method`, `shared_with` |
| `search_indices` | Meilisearch config metadata | `index_type`, `primary_key`, `synonyms`, `ranking_rules`, `last_indexed_at` |

### Core Functions/APIs
- `POST /api/v1/projects/{id}/auto-assign/toggle` – Enable/disable auto-assign with criteria payload.
- `POST /api/v1/disputes/{id}/offers` – Submit or respond to partial payment offers with validation rules.
- `GET /api/v1/launchpad/matches` – Retrieve auto-matched opportunities, including acceptance actions.
- `POST /api/v1/volunteers/invitations/{id}/respond` – Accept or decline volunteer invitations; triggers workflow.
- `POST /graphql` (Gigvora Ads mutations) – Create/update campaigns, creatives, budgets.
- `GET /api/v1/search` – Meilisearch-backed global search with filter parameters and pagination metadata.
- `POST /api/v1/escrow/{project_id}/release` – Process milestone release with compliance checks and ledger updates.
- `PATCH /api/v1/profile/status` – Update availability toggles, triggers presence broadcast and analytics.

---

## 8. Acceptance Criteria Highlights
- Flutter app passes store review guidelines (iOS/Android), supports biometrics, and meets crash-free >99%.
- Escrow transactions audited with zero reconciliation discrepancies; disputes resolved within defined SLA per stage.
- Live feed supports ≥10k daily posts with latency <500ms for interactions; moderation queue processes flagged content within 2 hours.
- Meilisearch explorer delivers relevant results with search success rate ≥85% (measured via analytics).
- Auto-assign increases project fill rate by ≥25%; launchpad placements complete within 14 days on average.
- Volunteer hub achieves ≥45% invitation acceptance, integrated analytics track volunteer hours.
- Gigvora Ads suite manages campaigns with accurate spend reporting (<1% variance) and supports ad scheduling/targeting rules.
- Profile completion average rises to ≥90% due to new sections and guided prompts.

---

## 9. Dependencies & Enablers
- Vendor contracts (escrow provider, KYC/KYB, Cloudflare R2, push notification services, analytics tools).
- Infrastructure provisioning (Meilisearch cluster, R2 buckets, CI/CD pipelines).
- Compliance/legal documentation for FCA, disputes, launchpad/volunteer policies.
- Data migration tooling for profile, project, ads, launchpad tables.
- Support and marketing enablement materials for launch communications.

---

## 10. Measurement & Monitoring
- **Dashboards**: Engagement (messages, feed), financial (escrow volume, disputes), adoption (profile completion, ATS usage), growth (launchpad fills, volunteer invites), monetisation (ads revenue).
- **Alerts**: Escrow reconciliation failures, search latency spikes, app crash rate thresholds, ads overspend, volunteer invite backlog.
- **Feedback Loops**: In-app surveys, beta cohorts, support ticket tagging, NPS segmented by user type.

These features collectively deliver the Version 1.00 vision: a blue-branded, mobile-first Gigvora platform with FCA-compliant trust mechanisms, dynamic collaboration, powerful discovery, and monetisation engines ready for global scale.
