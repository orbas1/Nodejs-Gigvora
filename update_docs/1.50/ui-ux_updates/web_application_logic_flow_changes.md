# Web Application Logic & Flow Changes — Version 1.50

## Overview
The Version 1.50 update rationalises logged-out marketing and logged-in workspace flows to shorten time-to-value and reinforce trust. Logic diagrams were expanded to clarify branch conditions, automation triggers, and integrations across marketing funnel, trial onboarding, and analytics usage.

## Key Flow Themes
- **Guided Discovery:** Mega-menu reorganised with contextual landing pages and dynamic content based on industry selection.
- **Conversion Focus:** Demo request and trial signup flows streamlined with reduced form fields and progressive profiling.
- **Self-Service Enablement:** Logged-in dashboards expose quick actions, contextual help, and data export scheduling.
- **Governance & Security:** Admin flows integrate audit logs, permission gating, and session management checkpoints.
- **Unified Authenticated Navigation:** Post-login header now routes Feed → Explore → Create → Dashboard → Profile, with the avatar drop-down gating access to admin, finance, and organisation-specific panels.

## Marketing Site Flows
### 1. Visitor → Demo Request
1. Visitor lands on homepage or campaign page; hero CTA instrumented with UTM metadata.
2. CTA triggers multi-step form with dynamic fields: name, email, company size, industry, use case.
3. Form validation occurs client-side; on submit, system triggers marketing automation workflow, sends confirmation email, and routes lead to CRM with scoring.
4. Success screen offers additional resources and calendar scheduling widget for immediate meeting booking.

### 2. Visitor → Self-Serve Trial
1. Landing page features prominent "Start Trial" CTA; selecting opens modal overlay.
2. Flow collects email, password, company name, region, and consent checkboxes. Password strength meter and SSO option included.
3. After submission, user directed to onboarding wizard; account flagged as trial with 14-day expiry timer.
4. Welcome email and in-app checklist triggered; marketing automation segments user into nurture track.

### 3. Content Exploration
- Mega-menu interactions fetch dynamic highlights per industry; analytics track selections.
- Resource hub filtering updates query string for sharable URLs and SEO benefits.
- Contact sales button opens chat widget with pre-populated context from page metadata.

## Logged-In Workspace Flows
### 1. Trial Onboarding Wizard
1. Step 1: Company Setup — collect organisation details, logos, brand colours; pre-populate from marketing form when available.
2. Step 2: Team Invitations — add teammates via email, assign roles (Admin, Manager, Analyst); invitation emails triggered.
3. Step 3: Service Configuration — choose templates, configure availability, import existing data via CSV/API.
4. Step 4: Go-Live Checklist — verification of compliance, payments, and communication settings.
5. Completion triggers celebratory modal, prompts to schedule onboarding call, and sets product tour status to complete.

### 2. Dashboard Interaction Flow
- Users land on overview dashboard; system checks role and personalises layout modules.
- Quick actions (create gig, invite provider, view insights) available in hero banner.
- Selecting KPI tile opens detailed analytics panel with filters and export options.
- Alerts feed surfaces tasks; clicking an alert deep-links to corresponding feature.

### 3. Admin & Permissions Flow
- Admin selects Settings → Team; sees list of members with status.
- Inviting new member opens modal with role selection, scope definition (regions, services), and optional welcome message.
- Permissions updates log to audit history, trigger notification to affected user, and update active session tokens.
- Deactivation prompts confirmation, reassign tasks, and record timestamp.

### 4. Billing & Plan Management Flow
- Billing tab displays current plan, usage metrics, and upcoming invoice preview.
- Upgrade CTA opens plan comparison drawer; selecting plan triggers payment collection and pro-rated billing logic.
- Add-ons (advanced analytics, priority support) accessible via toggles with contextual tooltips.
- Cancellation flow provides retention offers, collects reason, and schedules plan change at end of cycle.

### 5. Support & Feedback Flow
- In-app help launcher triggers search overlay; results combine knowledge base, community threads, and contact options.
- If user initiates chat, context (page, role, account tier) passed to support agent.
- Feedback submission posts to productboard integration, tagging module and sentiment.

### 6. Purchase & Subscription Flow
1. **Entry Points**
   - Upgrade prompts from dashboard hero, Feed banners, or Finance Settings direct to plan comparison page.
   - System checks user role to tailor messaging (e.g., agencies see multi-brand benefits, freelancers see portfolio boosts).
2. **Plan Configuration**
   - Users select plan, toggle add-ons (Networking, Mentorship, Analytics), and view ROI calculator updates in real time.
   - Add-on dependencies validated; unmet requirements prompt inline guidance.
3. **Checkout Execution**
   - Stepper collects billing entity, payment method, tax info, compliance acknowledgements, and optional promo codes.
   - Payment intent created via API; failure triggers retry with saved methods or contact sales CTA.
4. **Post-Purchase**
   - Success screen summarises plan, next billing date, and activated modules; triggers onboarding tasks for newly unlocked panels.
   - Finance dashboard updates with invoice, while notifications inform stakeholders of changes.

### 7. Role-Based Panel Flows
1. **Admin Control Center**
   - Admin selects Admin panel from avatar drop-down; overview fetches user counts, pending approvals, and incident alerts.
   - User management actions (add, edit, disable) require justification entry and log to audit history; permission changes propagate to access tokens.
2. **Agency & Company Management**
   - Agencies switch between brands; each brand loads workforce metrics, HR compliance status, and communication broadcasts.
   - Company managers manage departments, assign leaders, and review collaboration timeline; changes notify relevant members.
3. **Freelancer & User Panels**
   - Freelancers manage pipeline; moving cards triggers notifications to providers/users and updates utilisation analytics.
   - End users access Feed for personalised updates; Create launches multi-surface composer with autosave and preview states.
4. **Headhunter & Mentorship Panels**
   - Headhunters progress candidates through pipeline; scheduling interview auto-generates invites and syncs calendars.
   - Mentorship panel matches mentors/mentees; acceptance triggers session plan creation and reminder cadence.

### 8. Experience Launchpad & Creation Studio
- **Launchpad Flow:** Stepper collects concept, target audience, milestones, mentor involvement, and asset checklist; each milestone unlocks tasks and recommended templates.
- **Creation Studio Publishing:** Editor supports versioning; publishing triggers QA review, marketing notifications, and release schedule to Feed/Explore.
- **Networking & Speed Networking:** Hosts configure room capacity/duration; participants queue, rotate automatically, and receive summary of connections with follow-up prompts.

### 9. Project, Task, and Resource Management
- **Project Initiation:** Users define scope, timeline, budget; system generates default tasks and syncs with calendar.
- **Task Operations:** Drag-and-drop between Kanban stages triggers automation (notifications, dependency checks); board view ties into analytics for throughput and SLA tracking.
- **Calendar & Resource Sync:** Multi-source calendar overlays gigs, interviews, mentoring, volunteering; conflicts flagged with suggested resolutions.
- **Budget Oversight:** Budget dashboards compute allocation vs. spend, highlight variance thresholds, and require approvals for reallocation.

### 10. Recruitment & Interview Lifecycle
- **Job Listing Publication:** Wizard collects role details, requirements, media, and approvals; on publish, job syndicated, analytics events fired, and pipeline initialised.
- **Interview Coordination:** Candidate stage updates propagate to interviewer availability; interview room handshake ensures secure entry, recording consent, and evaluation capture.
- **Offer & Onboarding:** Offers require multi-level approval; acceptance initiates onboarding tasks and notifications to HR/agency modules.

### 11. Messaging, Inbox, & Support Escalation
- **Unified Inbox:** Aggregates communications across gigs, projects, interviews; prioritises by SLA and sentiment. Users can assign, snooze, or escalate threads.
- **Chat Bubble Access:** Authenticated-only bubble anchored bottom-right; opens mini inbox while retaining page context, offering quick actions and linking to full inbox.
- **Support Escalation:** Critical threads escalate to triage board with timeline, attachments, role assignments, and resolution tracking.

### 12. Governance, Legal, & Settings
- **Account Preferences:** Changes update via API with optimistic UI; significant updates require password re-auth and log audit record.
- **Finance Settings:** Payout updates trigger verification workflow, multi-factor approval, and status badges; invoice downloads logged for compliance.
- **Legal Acknowledgements:** When Terms/Privacy change, modal forces review, highlights summary, and records timestamp; rejection restricts access until accepted.

### 13. Consent Governance & SAR (27 Apr)
- **Policy Management:** Admin selects Governance → Consent. Panel fetches
  paginated policies with filters; selecting a row opens detail drawer with
  version history, locale manifests, and breach log. Activation action validates
  prerequisites (translations, effective date, migration backlog) before calling
  `/api/admin/governance/consents/:policyId/activate`.
- **Exports & Notifications:** Export CTA triggers CSV download for legal teams
  and raises analytics event. Breach alerts expose escalation CTA linking to
  incident runbook; dismissal logs actor/time for audit.
- **Settings Privacy Console:** Authenticated users navigate to Settings →
  Privacy. Toggle interactions call `/api/users/:id/consents/:policyId/accept`
  with optimistic UI; revoking triggers confirmation modal, checks
  `revocable=true`, and displays gating copy if withdraw blocked. SAR request
  button opens modal capturing reason, optional attachments, and acknowledgement;
  submission queues legal workflow and logs audit event.

## Automation & Integrations
- Marketing forms integrate with HubSpot; events include `demo_requested`, `trial_started`, `resource_downloaded`.
- Product telemetry flows into Segment; dashboards built in Looker monitor conversion funnel.
- Single Sign-On with SAML/OAuth ensures enterprise-grade access control; flow includes fallback for password login.
- Webhooks notify partner apps upon trial activation, invite acceptance, and plan upgrades.

## Security & Compliance Touchpoints
- All sensitive forms implement reCAPTCHA v3 scoring; suspicious traffic flagged for manual review.
- Privacy center offers data download and deletion flows with two-step verification.
- Session management allows admins to revoke sessions; idle timeout prompts after 30 minutes of inactivity.

## Testing & Optimisation
- Conducted usability tests on trial signup reducing average completion time by 42%.
- Monitored funnel analytics showing improved conversion from landing hero to trial by 9%.
- AB experiments planned for pricing layout and onboarding step order.

## Future Improvements
- Integrate guided tour builder to let admins customise onboarding sequences for their teams.
- Expand billing flow with self-serve invoice reconciliation and tax profile management.
- Launch trust center microsite with dynamic status updates and certifications.

## Maintenance Announcement Flow (10 Apr 2024)
1. **Fetch:** Admin dashboards load maintenance registry via `/api/admin/runtime/maintenance` with filters persisted in query params; public shell fetches `/api/runtime/maintenance` on boot and caches for 60s.
2. **Render Logic:**
   - Prioritise `status=active` announcements sorted by severity > soonest `startsAt`.
   - If no active announcements, show upcoming scheduled items within next 24h; else collapse banner.
3. **User Actions:**
   - "View details" opens modal with markdown body, impacted services list, and metadata. Modal includes copy-to-clipboard slug and export JSON button for ops tooling.
   - "Acknowledge" available for admin/prov roles only; triggers confirmation dialog and PATCH `/status` endpoint.
4. **Error Handling:** If API returns error, show fallback toast with retry; log to telemetry with error code.
5. **Analytics:** Fire events for impressions, acknowledgements, CTA interactions, and manual refresh; include `audience`, `channel`, `slug`, `status`.

## Domain Governance Registry Flow (23 Apr 2024)
1. **Fetch:** Dashboard bootstrap calls `/api/domains/governance` plus
   `/api/domains/:context/governance` lazily when a context is expanded. Responses
   hydrate Redux/React Query cache keyed by `contextName` with TTL 10 minutes.
2. **Render Logic:** Summary card aggregates contexts by review status, computes
   remediation backlog, and highlights overdue countdowns. Zero-data state prompts
   scheduling first audit; healthy state celebrates with positive messaging while
   still showing next review cadence.
3. **User Actions:** Selecting context opens drawer showing steward contacts,
   classification, retention targets, latest review notes, and remediation checklist.
   "Escalate" triggers mailto/Slack deep link; "Export" downloads CSV using shared
   schema. Checklist interactions dispatch analytics + update review backlog.
4. **Error Handling:** Network errors show inline retry with fallback to cached
   snapshot; 403 triggers permission banner instructing admin to adjust roles.
5. **Analytics:** Track `governance_summary_viewed`, `governance_context_opened`,
   `governance_export_clicked`, `governance_escalate_clicked` with payloads capturing
   context key, remediation severity, and time since last review.
