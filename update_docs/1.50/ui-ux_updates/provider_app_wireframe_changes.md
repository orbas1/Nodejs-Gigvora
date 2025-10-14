# Provider Application Wireframe Changes — Version 1.50

## Executive Summary
Version 1.50 introduces a system-wide uplift of the provider operations portal. Wireframes were redrafted to provide granular visibility into queues, predictable navigation, and guided workflows for onboarding and service management. The redesign was informed by 18 contextual inquiry sessions with agency managers and validated through three iterative low-fidelity testing rounds.

## Navigation & Information Architecture
1. **Primary Navigation Bar**
   - Converted left-rail nav into a collapsible hybrid with persistent icon strip and expandable labels, preserving vertical real estate for dashboard content.
   - Added quick-create button for "Add Service" and "Invite Team" anchored at the bottom of the nav rail.
   - Included status indicator for environment (Production/Sandbox) and account health summary.
2. **Secondary Navigation**
   - Introduced contextual sub-nav tabs atop key sections (Dashboard, Services, Finance, Support) for rapid switching between list, analytics, and settings views.
   - Implemented breadcrumb trail for deep hierarchies such as `Services > Cleaning > Package > Edit` to reduce disorientation.
3. **Global Utilities**
   - Unified global search field with scoped filters (people, gigs, documents) and quick actions inside results dropdown.
   - Added notification center with segmentation (alerts, tasks, conversations) and bulk acknowledge capabilities.

## Dashboard Wireframes
### Command Center Overview
- **Hero Metrics Strip:** Four KPI tiles (Active Gigs, Pending Approvals, SLA Breaches, Revenue This Week) with trend indicators and tooltips linking to detail pages.
- **Gig Pipeline Funnel:** Horizontal segmented funnel showing leads → proposals → booked → in-progress → completed, with clickable segments and inline CTA to create automation rules.
- **Alert Feed:** Right-column stack featuring colour-coded alert cards, each with severity badge, descriptive copy, and contextual actions (escalate, assign, mute).
- **Capacity Heatmap:** Calendar-style module representing workforce availability with overlay filters by location, skill, and shift type.
- **Task Queue Snapshot:** Scrollable list of top ten tasks, surfaced with due dates, owners, and status chips; inline checkboxes allow multi-complete from dashboard.

### Team Performance Dashboard
- Stacked bar visual for utilisation vs. target, filtered by team or individual.
- Leaderboard showing top-performing providers with productivity, rating, and upcoming gigs.
- Engagement timeline with markers for major updates (policy changes, training completions).
- Export bar providing CSV/PDF toggles and scheduling options.

## Queue Management Wireframes
- **List Layout:** 3-column responsive grid with persistent table header and inline column configurator.
- **Row Anatomy:** Left checkbox, avatar + service tag, gig metadata (client name, location, appointment window), SLA badge, and quick actions (assign, message, reschedule).
- **Bulk Action Toolbar:** Appears when rows selected, offering assign to, change status, apply template, or add note.
- **Detail Drawer:** Slides from right with tabs (Summary, Communication, History, Documents). Contains timeline of interactions, attachments grid, and escalate button.
- **Empty State:** Illustration, friendly copy, recommended filters, and CTA to explore automation settings.

## Service Catalog Wireframes
1. **Grid/List Toggle:** Allows providers to view services as cards (with hero image, price range, availability toggle) or as dense list for editing metadata quickly.
2. **Filtering Panel:** Left column with collapsible categories (Industry, Skills, Rating, Automation). Includes chip summary bar above content area.
3. **Service Detail:** Header containing service photo, rating, badges (Top Performer, Verified), and action buttons (Edit, Duplicate, Archive). Tabs for Overview, Pricing, Team, Automations.
4. **Packages Subsection:** Table with package name, included tasks, duration, base price, upsell toggles, and footnote on recommended audience.
5. **Version History:** Embedded timeline of edits with author, date, and change summary for auditability.

## Onboarding & Verification Wireframes
- **Start Screen:** Checklist summary, completion percentage, and CTA to resume previous step.
- **Step Layout:** Multi-step vertical progress tracker with status icons (complete, in progress, blocked). Each step uses two-column layout: left for form fields, right for guidance tips and required documents list.
- **Document Upload:** Drag-and-drop zone with preview thumbnails, quality indicator, and instructions for acceptable formats; includes scan with camera option on tablets.
- **Identity Verification:** Flow includes selfie capture guidance, liveness check explanation, and consent statement with digital signature capture.
- **Submission Confirmation:** Success state summarising next steps, expected review time, and link to view queue status.

## Finance & Payouts Wireframes
- Overview screen with upcoming payouts timeline, aggregated totals, and breakdown by service category.
- Payout detail screen showing transaction ledger, filters for status (scheduled, processing, paid), and download statement button.
- Tax documentation section with year selector, form cards (1099, VAT), and upload replacement call-to-action.
- Dispute management area containing dispute list, timeline view, evidence upload, and resolution actions.

## Messaging & Collaboration Wireframes
- Conversation list with tabs for Inbox, Assigned, Archived; includes search/filter chips and message preview snippet.
- Conversation view featuring header with participant info, SLA countdown, and status dropdown; message bubble styles with read receipts and agent avatars.
- Reply composer supporting rich text, quick responses, attachments, and mention suggestions.
- Shared notes panel displaying timeline of internal notes, with ability to pin important updates and subscribe teammates.
- Insights sidebar summarising sentiment analysis, previous interactions, and recommended follow-up templates.

## Settings & Administration Wireframes
- **General Settings:** Two-column layout with sectioned panels for company info, branding assets, regional preferences, and contact channels.
- **Team Management:** Table with member avatars, roles, permissions matrix (view/edit/approve), invitation status, and quick filters.
- **Automation Rules:** Rule list with status toggle, trigger summary, and quick run log; detail editor with IF/THEN builder, preview panel, and testing sandbox.
- **Security Center:** MFA enforcement controls, device history table, session revocation, and audit export.
- **Integrations:** Marketplace grid with partner logos, categories, integration status chips, and configuration CTA.

## Extended Management Suites
### Project & Gig Management Hub
- **Project Overview Canvas:** Kanban board with swimlanes for Discovery, Planning, Execution, QA, and Delivery; cards expose gig tags, owners, budget health, and next milestone.
- **Gig Lifecycle Tracker:** Timeline view highlighting inquiry, proposal, contract, delivery, review, and renewal checkpoints with automated SLA alerts.
- **Experience Launchpad:** Guided checklist for launching new offerings with embedded templates, asset upload sections, and mentor assignment slots.

### Talent & Workforce Panels
- **Freelancer Panel:** Persona-based dashboard surfacing assignment pipeline, credential expirations, utilisation meter, and direct links to schedule adjustments.
- **Agency Panel:** Multi-brand switcher, aggregated revenue reports, hiring funnel, HR compliance tracker, and agency-wide announcement broadcast card.
- **Company Panel:** Portfolio summary showing departments, open requisitions, hiring velocity, and cross-team collaboration timeline.
- **Headhunter Panel:** Candidate pipeline board with status chips, talent pool filters, interview readiness status, and offer management queue.
- **Mentorship Panel:** Mentor/mentee matching table, session scheduling calendar, goal-tracking progress rings, and feedback submission feed.

### Commerce & Finance Spaces
- **Purchase Page & Checkout:** Pricing tiles with plan comparison, add-on toggles, savings callouts, and stepper-led checkout collecting billing, payment, and compliance acknowledgements.
- **Budget Management Console:** Visual budget allocation chart, burn rate trendline, variance alerts, and reallocation workflow with approval gating.
- **Finance Settings:** Tabs for payout preferences, invoicing formats, tax profiles, and compliance documents with inline validation and digital signature capture.
- **Invoice & Payments Ledger:** Table of invoices with status filters, bulk download, export options, and quick action drawer for resend or void.

### Engagement & Communication Areas
- **Networking & Speed Networking Lounges:** Grid of live rooms with capacity indicators, countdown timers, and join buttons; includes attendee queue side panel and conversation prompts overlay.
- **Mentoring Studio:** Dual-pane layout featuring agenda, shared notes, resource library, and follow-up action items with due dates.
- **Messaging, Inbox, Chat Bubble:** Unified communications hub with omnichannel filters, collapsible contact list, pinned threads, and contextual insights card powering suggested responses.
- **Volunteering Marketplace:** Card grid of volunteer opportunities with skill tags, time commitment chips, map integration, and quick apply drawer.

### Interview & HR Modules
- **Job Listing Composer:** Multi-step builder covering role details, requirements, benefits, employer branding assets, and preview pane.
- **Interview Management Dashboard:** Calendar timeline with interviewer availability overlay, candidate stage tracker, and quick actions (reschedule, assign panelists, share prep materials).
- **Interview Room:** Split-screen layout enabling video embed, collaborative notes, scorecard entry, and resource drawer for portfolio review.
- **Agency HR Management:** Personnel directory with contract status, compliance documents, compensation bands, and renewal reminders.
- **Agency & Company Management Console:** Hierarchical view of departments/agencies, governance policy checklist, and automation summary for onboarding/offboarding sequences.

### Support & Governance
- **Account Preferences:** Tabs for notifications, privacy, localisation, accessibility, and experimental features with preview toggles.
- **Profile Page:** Modular layout with hero summary, KPI badges, verified credentials, testimonials, and timeline of key achievements.
- **About Us / Legal Pages:** Structured sections with mission statements, leadership bios, timeline infographic, and collapsible Terms & Conditions / Privacy Policy modules linking to compliance downloads.

### Dashboard Enhancements
- **Calendar System:** Unified calendar with colour-coded event types (gigs, interviews, mentoring, volunteering), drag-to-schedule, and sync indicators for Google/Microsoft integrations.
- **Task Management:** Multi-view (list, kanban, calendar) with priority flags, dependencies, subtask nesting, and time tracking chips.
- **Analytics Widgets:** Role-specific metrics for hiring velocity, mentorship hours, volunteer impact, financial health, and community engagement rates.

## Mobile & Responsive Considerations
- Collapsible nav rail transforms into bottom sheet menu on ≤1024px widths; persistent quick-create button converts to FAB.
- Dashboard modules stack vertically with swipeable carousels for KPI tiles.
- Detail drawers morph into full-screen overlays with top-mounted close button and sticky action bar.
- Tables adopt card-based representation with expandable accordions for metadata.

## Prototype & Testing Notes
- Low-fidelity wireframes produced in FigJam, mid-fidelity in Figma using shared auto layout components.
- Conducted unmoderated Maze tests with 84 participants measuring task completion for "Assign gig" and "Upload compliance document".
- Feedback led to relocating the bulk action toolbar, enlarging document preview thumbnails, and adding more descriptive queue filters.

## Next Steps
- Translate wireframe learnings into high-fidelity mockups, ensuring component library coverage.
- Collaborate with engineering to validate technical feasibility of new data visualisations (heatmap, timeline).
- Prepare interactive prototype for executive review with recorded walkthrough and success metrics overlay.
