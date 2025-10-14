# Provider Application Logic & Flow Changes — Version 1.50

## Overview
The provider portal received comprehensive journey rewiring to remove redundant steps, surface contextual automation, and ensure parity between desktop and tablet experiences. The redesigned flows emphasise clear entry points, explicit system feedback, and branching logic that adapts to service tier and compliance status.

## Guiding Principles
- **Task-Oriented Navigation:** Primary flows begin from dashboard KPIs and action prompts, reducing context switching.
- **Progressive Disclosure:** Complex configurations unfold in digestible segments with savepoints and quick exits.
- **Automation Hooks:** Each flow identifies triggers for notifications, rule automation, and analytics instrumentation.
- **Error Resilience:** Validation occurs early with explicit recovery options, preventing dead ends.

## Key Flow Updates
### 1. Provider Onboarding
1. **Invitation & Account Creation**
   - Email invite contains direct sign-in link, fallback OTP option, and expiry warning.
   - Account creation requests legal name, role, region, multi-factor preference; real-time checks for duplicate profiles.
2. **Company Verification**
   - Branches based on provider type (Individual, Agency, Enterprise). Each branch adjusts required documentation and approval SLA.
   - Document capture includes AI-assisted quality review and immediate feedback; failure triggers reupload loop with tips.
3. **Service Selection**
   - Wizard surfaces recommended service templates using industry selection and historical performance data.
   - Flow records automation rules to preconfigure availability, pricing defaults, and compliance disclosures.
4. **Final Review & Activation**
   - Summary page highlights outstanding requirements, acceptance of terms, and optional training modules.
   - Activation triggers welcome sequence, app tour checklist, and assignment to onboarding specialist.

### 2. Gig Intake & Assignment
1. **Trigger Events**
   - Gigs enter system via marketing site, consumer app, API integrations, or manual creation; events tagged with origin for reporting.
2. **Qualification Rules**
   - Rule engine matches gigs to eligible providers based on skill tags, capacity, compliance standing, and proximity.
   - Exceptions routed to review queue with suggested remediation actions.
3. **Assignment Flow**
   - Coordinator selects gig from queue, views recommended assignees with ranking score and scheduling fit.
   - Accepting prompts optional pre-engagement checklist (documents, deposits) with ability to send automated requests to consumer.
4. **Confirmation & Notifications**
   - System issues confirmation to provider and consumer, updates calendar, and schedules reminder sequence (48h/24h/2h).
   - SLA timer begins; dashboard badge increments for active gigs.

### 3. Service Editing & Publishing
- **Draft vs. Live States:** Editing a live service forks to draft; all changes tracked with version control.
- **Pricing Adjustment Flow:** Inline calculator updates hourly/package rates, previews consumer-facing card, and highlights margin impacts.
- **Automation Attachments:** Flow encourages linking onboarding checklists, message templates, and feedback surveys.
- **Publishing Checklist:** Pre-flight validation ensures assets (images, descriptions), compliance (licenses), and translations are present before promoting draft to live.

### 4. Compliance Case Resolution
1. **Detection**
   - Cases triggered by automated risk signals, manual reports, or integration alerts.
   - Severity classification controls escalation path (self-service, manager review, compliance team).
2. **Investigation Workspace**
   - Coordinator receives timeline view with event markers, relevant documents, and chat transcripts.
   - Branching logic offers recommended actions (request evidence, suspend service, escalate).
3. **Resolution**
   - Actions log with reason codes, attachments, and notifications to affected parties.
   - Closing case updates compliance dashboard, resets monitoring state, and schedules follow-up audit if necessary.

### 5. Financial Reconciliation & Payouts
- **Payout Scheduling:** Flow aggregates completed gigs, checks for disputes, and applies payout calendar rules per region.
- **Adjustment Handling:** When manual adjustments entered, system triggers dual approval flow with finance lead sign-off.
- **Statement Delivery:** Providers choose digital vs. downloadable statements; flow records delivery preferences and log retention.
- **Dispute Response:** Branch for dispute prompts evidence upload steps, collaboration with support, and timer resets upon response submission.

### 6. Purchase & Subscription Management
1. **Plan Selection**
   - User launches from Dashboard → Upgrade CTA or Finance Settings → Plans tab.
   - Toggle between Monthly/Annual surfaces savings messaging; selecting plan loads comparison matrix with feature tooltips.
2. **Add-on Configuration**
   - Flow surfaces optional modules (Networking Lounge, Mentorship Suite, Advanced Analytics) with requirement badges.
   - Selecting add-on updates order summary in real time and triggers dependency checks (e.g., Mentorship requires verified mentors).
3. **Checkout & Compliance**
   - Stepper collects billing entity, payment method, tax IDs, and compliance attestations; integrates fraud checks and VAT validation.
   - Users review pro-rated charges; accept terms (links to Terms & Conditions, Privacy Policy) before submission.
4. **Confirmation & Activation**
   - Success screen outlines next steps, generates invoice, and schedules follow-up email with receipts; activated modules broadcast to relevant dashboards.

### 7. Project, Task, and Calendar Governance
1. **Project Creation**
   - Initiated via Create → Project or from Experience Launchpad recommendations.
   - Flow requests project goals, timeline, budget, stakeholder roles, and deliverable templates; auto-assigns default tasks based on gig type.
2. **Task Lifecycle**
   - Tasks move between Backlog, In Progress, Blocked, Review, Done; transitions trigger notifications and optional automation (e.g., assign QA on Review entry).
   - Time tracking logs manual entries or integrates with connected timer; budget burndown recalculates upon each update.
3. **Calendar Coordination**
   - Calendar sync verifies conflicts across gigs, interviews, mentoring sessions, and volunteering commitments; conflict detection prompts reschedule suggestions.
   - Accepting suggestion updates relevant participants and sends recap via messaging service.

### 8. Talent & Panel Operations
1. **Freelancer & Agency Rosters**
   - Rosters auto-segmented by status (Active, Pending, On Hold); filtering by skill, location, rating.
   - Bulk actions (message, assign, request update) available with permission gating.
2. **Company & Headhunter Pipelines**
   - Kanban pipeline for requisitions; columns represent stage (Intake, Sourcing, Screening, Interviewing, Offer, Closed).
   - Movement triggers analytics updates, interview scheduling prompts, and compliance checks (e.g., background verification pending).
3. **Mentorship Programs**
   - Matching algorithm proposes mentor/mentee pairs based on expertise, goals, and availability; admin approves/overrides matches.
   - Session scheduling flow logs agenda, location (virtual/in-person), and resources; post-session survey dispatched automatically.

### 9. Community & Growth Experiences
1. **Networking & Speed Networking**
   - Hosts create rooms with capacity and duration; participants queue and receive join tokens.
   - Timer orchestrates rotations; end-of-session prompts participants to save contacts or schedule follow-up.
2. **Creation Studio**
   - Template gallery curated by industry; selecting template launches editor with modules for media, copy, pricing, and compliance check.
   - Publishing pushes to Explore feed and optionally triggers marketing email to subscribed audiences.
3. **Volunteering & Experience Launchpad**
   - Volunteer opportunities imported via partner APIs; flow validates background checks before confirming placement.
   - Launchpad guides new experience creation with milestone tracking, mentor assignment, and go-live checklist.

### 10. Recruitment & Interview Management
1. **Job Listing Publication**
   - Compose listing, attach media, set application channels (Gigvora apply, external ATS); preview accessible layout.
   - Publishing triggers syndication, team notifications, and analytics instrumentation for views/applies.
2. **Interview Coordination**
   - Candidate pipeline integrates with calendar; scheduling flow checks interviewer availability and time zones.
   - Interview room activated with secure token; moderators can start/stop recording, push evaluation prompts, and capture decision.
3. **Offer & Onboarding**
   - Post-interview decision board surfaces recommended actions; selecting Offer generates template, collects approvals, and dispatches to candidate.
   - Accepted offers spawn onboarding task list synced with HR/agency modules.

### 11. Messaging & Support Flows
- **Unified Inbox:** Prioritises threads by SLA and sentiment; assignment workflow ensures accountability with collision detection.
- **Chat Bubble Trigger:** Authenticated-only bubble opens mini inbox; interactions log to CRM and push quick-reply suggestions.
- **Support Escalation:** Conversations flagged as critical route to escalation board with timeline, attachments, and cross-team notes.

### 12. Governance & Compliance Touchpoints
- **Account Preferences:** Modals enforce validation for security toggles (MFA, session length) and track audit trails.
- **Finance Settings:** Editing payout accounts triggers verification micro-deposit workflow; finance roles required for approvals.
- **Legal & Policy Pages:** Accepting updated Terms/Privacy prompts acknowledgement log; deferrals disable publishing until accepted.

## Cross-Flow Enhancements
- **Universal Save State:** All long forms support auto-save every 20 seconds, with unsaved changes prompts on navigation.
- **Guidance Layer:** Inline tooltips, learn more modals, and contextual videos triggered based on user role and stage.
- **System Alerts:** Real-time banners alert providers of service outages, policy updates, or required actions impacting active flows.
- **Accessibility Considerations:** Keyboard navigation order defined, screen reader announcements for stage transitions, and consistent focus management.

## Automation & Integrations
- **Webhook Triggers:** Documented new events for onboarding completion, gig reassignment, and payout finalisation for partner integrations.
- **API Dependencies:** Confirmed required API endpoints (services, calendar, compliance) support new branching logic and error messaging.
- **Analytics Instrumentation:** Added event taxonomy for start/complete/cancel, step durations, and error categories to feed provider insights dashboards.
- **Notification Strategy:** Defined priority levels for email, SMS, in-app, and push notifications; centralised control via notification settings page.

## Testing & Validation
- Conducted heuristic evaluation ensuring flows adhere to Nielsen Norman heuristics.
- Ran 36 scenario-based tests (12 per core flow) with mixed-experience participants measuring time on task, error recovery, and satisfaction (SUS score improved from 68 → 82).
- Implemented journey analytics dashboards to monitor funnel drop-offs post-release with weekly review cadence.

## Change Management
- Updated SOPs and training documentation for provider support teams.
- Scheduled webinars and in-app tours to guide existing providers through new flows.
- Created contingency rollback plan for each major flow in case of critical production issues.

## Next Iterations
- Evaluate AI-assisted queue triage to further automate assignment recommendations.
- Expand compliance resolution to incorporate machine-learning severity predictions.
- Explore in-flow chat support for onboarding to reduce support tickets.
