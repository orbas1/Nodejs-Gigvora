# Provider App Wireframe Changes – Version 1.00

## Dashboard & Home Hub
- **Hero band:** Slim banner showing organisation avatar, compliance status (KYC, escrow), and quick links to profile health.
- **Pipeline overview:** Three-column metric cards for Active Opportunities, Pending Applications, and Projects In Delivery, each with sparkline trend and "View" CTA.
- **Action grid:** Four-tile quick actions (Post Opportunity, Create Launchpad Cohort, Invite Talent, Review Disputes) using rounded 24px cards and iconography consistent with desktop header.
- **Activity feed:** Right-aligned timeline listing newest proposals, milestone submissions, and chat mentions, each using pill status chips (e.g., `New`, `Awaiting Approval`).
- **Announcements module:** Banner slot for compliance alerts, marketing pushes, or ads credit reminders with dismiss controls.

## Opportunity Composer
- **Stepper layout:** Horizontal progress indicator (Basics → Requirements → Compensation → Preview → Publish) with persistent save-as-draft button.
- **Form sections:** Each step uses stacked field groups with helper text, inline validation, and toggles for remote/on-site, rate type, and application deadline.
- **Attachments tray:** Side rail for uploading briefs, portfolio inspiration, or NDAs, supporting drag-and-drop on desktop and native upload on mobile.
- **Preview pane:** Split-view preview card reflecting final listing with hero summary, meta chips, and CTA; allows quick theme toggles (light/dark) to ensure readability.

## Launchpad & Volunteer Cohort Builder
- **Cohort cards:** Grid showing active cohorts with enrolment progress bars, date range chips, and "Manage Curriculum" link.
- **Curriculum editor:** Two-column layout with module list on left (drag-and-drop reorder) and detail pane on right for descriptions, objectives, and resources.
- **Participant management:** Table view with avatar, role, status, and action menu (`Promote`, `Message`, `Remove`).
- **Volunteer impact:** Dashboard summarising hours contributed, skills unlocked, and partner NGOs with filterable timeline.

## Project & Delivery Spaces
- **Project overview:** Tabbed interface (Summary, Milestones, Files, Chat, Time Logs) with summary hero containing project health badge and budget utilisation gauge.
- **Task board:** Kanban columns for Backlog/In Progress/Review/Done using draggable cards, checklists, and due date pills.
- **Milestone review:** Card stack with deliverable preview, submission metadata, acceptance buttons, and dispute escalation link.
- **File manager:** Grid of file tiles with preview thumbnails, storage badges (R2), and version history modal.

## Opportunity & Candidate Detail Views
- **Opportunity detail:** Dedicated page with hero summary, status badge, share/save icons, and quick metrics (views, applications, matches). Tabs for Overview, Requirements, Compensation, Applicants, Activity.
- **Applicant roster:** Responsive table/cards showing avatar, tags, match score, application date, and stage. Inline actions for shortlist, schedule, decline.
- **Candidate deep dive:** Split layout with resume preview, interview notes, rubric scoring slider, and CTA cluster (Advance, Offer, Decline, Request info).
- **Offer builder:** Modal sequence capturing compensation package, start date, and contract attachments with preview before sending.

## Communications & Support
- **Inbox:** Two-pane messaging layout with conversation list, unread counters, and quick filters (All, Projects, Launchpad, Disputes).
- **Chat thread:** Header shows participant avatars, project tag, and quick actions (Schedule call, Open board). Composer supports attachments, slash commands for templates, and read receipts.
- **Notifications drawer:** Slide-in panel accessible from top nav summarising alerts with quick mark-as-read and deep links to screen sections.
- **Support centre:** Dedicated page combining knowledge base search, compliance FAQs, and ability to open tickets or request mediation.

## Settings & Organisation Profile
- **Profile completeness dial:** Circular progress indicator with checklist (Branding, Team, Compliance, Billing).
- **Team management:** Table for team members with role dropdowns, invitation states, and permission chips (Projects, Ads, Finance).
- **Brand assets:** Upload area for logos, cover imagery, and brand guidelines with live preview.
- **Billing & escrow:** Accordion exposing payouts schedule, wallet balance, invoice download, and dispute ledger.
- **Integration centre:** Cards for connecting ATS, calendar, CRM, and analytics with status chips and reconnect CTAs.

## Analytics & Ads Command Centre
- **Performance overview:** KPI tiles for application volume, conversion rate, cost-per-application, and launchpad engagement.
- **Chart deck:** Line/bar/area charts with timeframe selectors, segmentation chips, and export buttons.
- **Ads manager:** Campaign list with spend progress bars, status indicators, and quick edit/pause controls.
- **Insights feed:** Recommendations cards highlighting underperforming listings, suggested budget adjustments, and trending skill gaps.

## Responsive & Accessibility Considerations
- Desktop-first with collapsible sidebars for <1280px, responsive card stacking for tablet, and simplified single-column flows on mobile.
- Persistent floating action button on mobile for "Post opportunity"; long-form steps break into accordions for smaller screens.
- Colour contrast meets WCAG AA with accent/dark pairings; focus rings visible on interactive components; keyboard navigation supported for stepper and tables.
