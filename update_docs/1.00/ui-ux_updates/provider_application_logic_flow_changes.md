# Provider Application Logic Flow Changes – Version 1.00

## 1. Onboarding & Compliance
1. **Account creation:** Provider selects organisation type → completes core details (name, domain, location) → invites additional admins.
2. **Verification checklist:** Stepper triggers KYC/KYB submission, bank account linking, and agreement acceptance; gating logic holds posting until checks complete.
3. **Profile priming:** After verification, guided wizard captures brand assets, showcase projects, and preferred categories to seed dashboard metrics.
4. **Role provisioning:** Admin assigns permissions (Projects, Ads, Finance) to invited teammates; roles drive conditional UI (e.g., finance-only sees escrow screens).

## 2. Opportunity Lifecycle
1. **Drafting:** Provider opens composer → selects template (job/gig/project/launchpad/volunteer) → enters details with auto-save every 10 seconds.
2. **Review & preview:** Validation ensures required fields, estimated compensation, and compliance tags. Preview renders final listing for cross-platform QA.
3. **Publishing:** On publish, listing enters moderation queue if risk flags present; otherwise, becomes discoverable and pushes to live feed.
4. **Promotion:** Option to boost via Gigvora Ads; flow collects budget, duration, and targeting, then surfaces analytics tile on dashboard.

## 3. Applicant & Talent Management
1. **Intake:** Applications aggregated per opportunity with filters for stage, rating, and source (manual, auto-assign, referrals).
2. **Screening:** Provider reviews candidate card → opens detail modal showing resume, launchpad progress, and community endorsements → records decision (advance, hold, decline).
3. **Collaboration:** Selected candidates trigger chat thread + optional interview scheduling (synced to calendar). Decisions update analytics and notify applicant.
4. **Conversion:** When provider hires, opportunity transitions to project; automated tasks and escrow setup triggered.

## 4. Project Delivery & Escrow
1. **Kick-off:** Project template clones milestones; provider assigns responsibilities, due dates, and deliverables.
2. **Work tracking:** Team logs time/tasks; milestone submissions route to provider for approval with ability to request revisions or escalate disputes.
3. **Escrow release:** Upon approval, escrow ledger releases funds; finance view updates balance, invoices generated for download.
4. **Dispute management:** If flagged, flow routes to mediation centre with evidence upload, communication timeline, and final decision logging.

## 5. Launchpad & Volunteer Coordination
1. **Cohort creation:** Provider defines cohort goal, timeline, and capacity; invites mentors and sets curriculum modules.
2. **Participant onboarding:** Accepted participants receive onboarding tasks; progress tracked via milestone completion and skill badges.
3. **Engagement:** Weekly check-ins, assignments, and showcase events tracked; providers can broadcast updates to volunteers/mentees.
4. **Impact reporting:** After cohort, dashboards summarise placement rates, volunteer hours, and partner satisfaction.

## 6. Analytics & Insights
1. **Data collection:** All interactions (views, applications, conversions, disputes) funnel into analytics pipeline with time stamps and segments.
2. **Dashboard visualisation:** Metrics populate cards, charts, and sparklines; filters allow breakdown by opportunity type, time range, and team member.
3. **Alerting:** Threshold breaches (e.g., dispute spike) trigger notifications and highlight modules on dashboard.
4. **Export:** Providers can export CSV/Share link for stakeholders; exports respect role-based access.

## 7. Support & Feedback
1. **Self-service:** Knowledge base search suggestions appear as provider types; results open inline.
2. **Ticketing:** If unresolved, provider opens ticket specifying category (technical, compliance, billing) and severity; attachments supported.
3. **Resolution loop:** Support agent responses appear in thread; provider marks resolved or escalates to dispute resolution.
4. **Feedback:** After resolution, satisfaction survey triggers, feeding NPS analytics.
