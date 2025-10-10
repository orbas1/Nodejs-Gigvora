# Screens Update – Version 1.50

## Overview
Version 1.50 expands the phone app to 62 core screens organised across onboarding, discovery, work management, communications, and settings. Each screen is mapped to component libraries and aligned to design tokens introduced in this release.

## Screen Groups
1. **Onboarding & Authentication (8 screens)**
   - Welcome, Persona selection, Identity verification, Skills collection, Company setup, Compliance consent, MFA setup, Tutorial overview.
2. **Home & Feed (10 screens)**
   - Home dashboard variants (Talent/Client/Agency), Live feed list, Post composer, Post preview, Post analytics, Notification centre, Saved items, Quick actions.
3. **Discovery & Search (7 screens)**
   - Global search, Filter panel, Saved searches, Recommendations hub, Volunteer hub, Launchpad discovery, Ads marketplace.
4. **Work Management (13 screens)**
   - Project list, Project detail tabs (Overview, Tasks, Files, Chat, Escrow), Contest workspace, Time tracking, Milestone approval, Deliverable review, Dispute timeline.
5. **Jobs & Gigs (7 screens)**
   - Job board, Gig list, Application detail, Auto-assign modal, Job creation (Client), Job analytics, Launchpad coach.
6. **Communication (6 screens)**
   - Unified inbox, Conversation detail, Threaded replies, Support ticket wizard, Video hand-off prompt, Chat settings.
7. **Profile & Reputation (6 screens)**
   - Profile overview, Edit sections, Trust score explainer, Portfolio manager, Testimonials, Analytics snapshot.
8. **Settings & Utilities (5 screens)**
   - Settings home, Notification preferences, Privacy controls, Payment methods, Legal & compliance centre.

## Key Additions
- **Floating Action Hub:** A modal overlay triggered from FAB that routes users to create posts, projects, jobs, or ads.
- **Escrow Timeline:** Integrated timeline showing escrow stages with CTA for release or dispute.
- **Launchpad Coach:** Guided progress interface with readiness score and checklist.
- **Volunteer Spotlight:** Dedicated screen to highlight volunteer opportunities with shareable cards.
- **Secure Authentication Stack:** Revised login, MFA, and recovery screens with biometric confirmation hooks and rotation messaging.

### Authentication – Login & MFA
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ AppBar: Logo centred | Help icon (top right)                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ ContentStack                                                                   │
│  • Heading ("Welcome back") + body copy referencing secure session hand-off    │
│  • FormGroup 1: Email field (inline validation, helper text)                   │
│  • FormGroup 2: Password field (toggle visibility, forgot link)                │
│  • Primary CTA: "Request 2FA code" (disabled until valid input)               │
│  • Secondary CTA: Link to password recovery                                    │
│  • Inline status region for cooldown and lockout messaging                     │
├──────────────────────────────────────────────────────────────────────────────┤
│ MFA Sheet (post-request)                                                       │
│  • Countdown timer + resend button (appears after 60s)                         │
│  • Code input (6 slots) with auto-advance + accessibility friendly fallback    │
│  • Device fingerprint summary + "Trust this device" switch                     │
│  • Secondary CTA: "Use authenticator app" (future)                            │
│  • Warning banner when attempts >= 3                                           │
└──────────────────────────────────────────────────────────────────────────────┘
```
- **Interactions:** Countdown disables resend until timer elapses. Lockout state replaces CTA with support escalation link.

## Deprecated Screens
- Legacy “Messages” and “Support” tabs replaced by unified inbox.
- Old “Wallet” screen replaced by Escrow + Payout overview integrated into project and settings sections.

## Dependencies
- Each screen references shared widget types defined in `Screens__Update_widget_types.md` and styling tokens in `Colours.md` and `Fonts.md`.

## Detailed Screen Blueprints
The following blueprints translate the conceptual groupings above into concrete, line-by-line layouts. Each diagram uses a 12-column responsive grid (columns labelled C1–C12) with vertical rhythm of 8px increments. Component IDs map directly to widget definitions in `Screens__Update_widget_types.md` and behavioural notes in `Screens_Updates_widget_functions.md`.

### Home Dashboard (Talent Persona)
```
┌──────────────┬──────────────────────────────────────────────────────────────┐
│ AppBar       │ [C1-C8] Title: "Today"  | [C9-C10] WorkspaceChip  | [C11-C12] Avatar │
├──────────────┴──────────────────────────────────────────────────────────────┤
│ BannerRow    │ [C1-C12] ComplianceBanner (ID:BNR-001)                         │
├──────────────────────────────────────────────────────────────────────────────┤
│ MetricStrip  │ [C1-C4] MetricTile(M1) | [C5-C8] MetricTile(M2) | [C9-C12] MetricTile(M3) │
├──────────────────────────────────────────────────────────────────────────────┤
│ Launchpad    │ [C1-C8] LaunchpadChecklist | [C9-C12] TrustScoreDial           │
├──────────────────────────────────────────────────────────────────────────────┤
│ FeedList     │ Row 1: FeedCard(FD-01)                                        │
│              │ Row 2: FeedCard(FD-02)                                        │
│              │ Row 3: FeedCard(FD-03)                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│ FAB Hub      │ FloatingActionHub anchored bottom-right (offset 24px, ID:FAB-CORE) │
└──────────────────────────────────────────────────────────────────────────────┘
```
- **Interactions:** Metric tiles elevate on hover/tap with drop shadow +4 elevation. Feed cards support swipe gestures (save/share) defined in widget catalogue. FAB opens creation sheet with persona-scoped options.

### Project Detail – Tasks Tab
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ AppBar: Breadcrumb(Project List > Nova Redesign) | CTA: "Create Task"        │
├──────────────────────────────────────────────────────────────────────────────┤
│ StatusRow: [C1-C6] EscrowTimeline(ID:ESC-002) | [C7-C12] ProgressBar(ID:PRG-001) │
├──────────────────────────────────────────────────────────────────────────────┤
│ TabStrip: Overview | Tasks(active) | Files | Chat | Escrow                    │
├──────────────────────────────────────────────────────────────────────────────┤
│ FilterRow: StatusChipGroup | SortDropdown | SearchField                       │
├──────────────────────────────────────────────────────────────────────────────┤
│ TaskList:                                                                   │
│  • TaskCard(TK-01) with subtasks + inline checklist                          │
│  • TaskCard(TK-02) flagged (status badge red)                                │
│  • TaskCard(TK-03) completed (strike-through)                                │
├──────────────────────────────────────────────────────────────────────────────┤
│ StickyFooter: "Log Time" secondary button | "Submit Deliverable" primary CTA │
└──────────────────────────────────────────────────────────────────────────────┘
```
- **Interactions:** Task cards expand on tap to show description and attachments. Sticky footer persists with translucency (rgba(12,18,28,0.92)).

### Job Board (Client Persona)
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ AppBar: Title "Opportunities" | CTA: "Create Job"                            │
├──────────────────────────────────────────────────────────────────────────────┤
│ FilterDrawer Toggle(left) | SearchField(center) | ViewSwitch(list/grid)      │
├──────────────────────────────────────────────────────────────────────────────┤
│ FilterChipsRow: Status, Budget, Timeline, Skills, Remote Toggle              │
├──────────────────────────────────────────────────────────────────────────────┤
│ JobCards Masonry (2-column on tablet, 1-column mobile)                       │
│  • JobCard(JB-001) – includes QuickActions(save/share/hide)                  │
│  • JobCard(JB-002) – has Badge "Hot"                                        │
│  • JobCard(JB-003) – shows ApplicantCount pill                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ Bottom Sheet (optional): Filter panel when Toggle active                     │
└──────────────────────────────────────────────────────────────────────────────┘
```
- **Interactions:** Job cards scale to 98% on press with 150ms ease. Filter drawer slides from right with scrim 40% opacity.

### Unified Inbox
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ AppBar: "Inbox" + SegmentControl(All / Projects / Support)                   │
├──────────────────────────────────────────────────────────────────────────────┤
│ Search + FilterRow: SearchField | FilterChip(unread) | FilterChip(pin)       │
├──────────────────────────────────────────────────────────────────────────────┤
│ ConversationList:                                                            │
│  • ThreadRow(TH-01) pinned with star icon                                    │
│  • ThreadRow(TH-02) shows unread counter                                     │
│  • ThreadRow(TH-03) support ticket with SLA badge                            │
├──────────────────────────────────────────────────────────────────────────────┤
│ QuickActions Dock (bottom):                                                  │
│  • New Message (primary) | Schedule Call (secondary) | Support Wizard (tertiary) │
└──────────────────────────────────────────────────────────────────────────────┘
```
- **Interactions:** Swiping a thread reveals quick actions (Archive, Pin, Mark Read). Support wizard launches context-aware form.

### Application Review Board
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ AppBar: "Applications" | SegmentControl(All / Shortlist / Interviews / Offers) │
├──────────────────────────────────────────────────────────────────────────────┤
│ FilterRow: TargetType chips (Jobs, Gigs, Projects, Launchpad, Volunteer)       │
│            Status dropdown (Submitted, Under Review, Hired, Rejected)         │
│            DateRange picker + Export button                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│ TableHeader: Candidate | Role | Stage | Score | Updated | Actions              │
├──────────────────────────────────────────────────────────────────────────────┤
│ ApplicationRow (loop):                                                        │
│  • Column 1: Avatar + Name + Persona Chip                                    │
│  • Column 2: Role title + Target workspace badge                              │
│  • Column 3: Stage pill (colour-coded) + inline dropdown to advance stage     │
│  • Column 4: Score dial (0-100) editable + tooltip linking to review history  │
│  • Column 5: Relative timestamp + SLA badge                                   │
│  • Column 6: Actions (Open review drawer, Send message, Archive)              │
├──────────────────────────────────────────────────────────────────────────────┤
│ ReviewDrawer (slide over):                                                    │
│  • Tabs: Overview | Notes | Audit Log                                         │
│  • Overview shows cover letter preview, attachments, and metadata             │
│  • Notes tab lists reviewer comments with timestamps                          │
│  • Audit Log exposes status events referencing analytics + compliance IDs     │
│  • Footer: Buttons [Advance Stage] [Reject] [Schedule Interview]              │
└──────────────────────────────────────────────────────────────────────────────┘
```
- **Interactions:** Stage pill updates trigger confirmation modal with comment entry to ensure audit completeness; analytics event emitters capture stage change, rejection reason, and export usage.
- **Data Contract:** Table rows hydrate from the sanitised `Application` service payload; suppressed metadata fields surface a "Limited visibility" chip and prompt refresh when cache invalidation callbacks fire.

### Notification Preferences
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ AppBar: "Notification Settings" | CTA: Restore defaults                       │
├──────────────────────────────────────────────────────────────────────────────┤
│ DeliveryGrid (cards for Push, Email, SMS, In-App)                             │
│  • Each card includes toggle, digest frequency dropdown, quiet hour selector  │
├──────────────────────────────────────────────────────────────────────────────┤
│ CategoryMatrix (table):                                                       │
│  • Rows: System, Messages, Projects, Financial, Compliance, Marketing         │
│  • Columns: Push, Email, SMS, In-App with checkboxes                          │
│  • Last column: Escalation rule summary                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│ QuietHoursCard: Time pickers + timezone badge                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│ DigestPreview: Sample email preview with CTA to send test message             │
└──────────────────────────────────────────────────────────────────────────────┘
```
- **Interactions:** Digest frequency change prompts toast confirming analytics tracking update. Quiet hours enforce validation to avoid overlap and display warning if compliance alerts disabled.
- **Data Contract:** Channel toggles mirror `NotificationPreference` service responses, with inline banners when quiet-hour enforcement delays in-app delivery based on backend cache evaluation.

### Provider Workspace Directory
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ AppBar: "Workspaces" | CTA: Create workspace                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│ StatsRow: Active count, Pending invites, Suspended                            │
├──────────────────────────────────────────────────────────────────────────────┤
│ WorkspaceCards (grid):                                                        │
│  • Card header: Workspace name + type pill (Agency/Company/Recruiter/Partner) │
│  • Body: Owner avatar, timezone, default currency, intake email               │
│  • Footer: Buttons [Open], [Manage Members], [View Notes]                     │
├──────────────────────────────────────────────────────────────────────────────┤
│ InvitePanel (side): Pending invites list with resend/cancel actions           │
└──────────────────────────────────────────────────────────────────────────────┘
```
- **Interactions:** Creating workspace launches modal capturing slug and compliance requirements. Manage Members opens nested screen aligning with provider membership statuses.
- **Data Contract:** Member list and invite panes read from the provider workspace service with badge states derived from sanitised payload flags (`status`, `role`) and display audit chips when cache indicates pending invalidation.

### Settings Home
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ AppBar: "Settings" | IconButton(help)                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│ ProfileTile (ID:PRF-SET-01) – avatar + edit link                             │
├──────────────────────────────────────────────────────────────────────────────┤
│ SectionList:                                                                  │
│ 1. Account & Security – ListItem with MFA status badge                        │
│ 2. Notifications – ListItem with toggle summary                               │
│ 3. Payments – ListItem with linked payout method                              │
│ 4. Legal & Compliance – ListItem with unread indicator                        │
├──────────────────────────────────────────────────────────────────────────────┤
│ SupportBlock: Card with CTA "Contact Support" (secondary)                    │
└──────────────────────────────────────────────────────────────────────────────┘
```
- **Interactions:** List items open detail screens via slide transition. Support block uses neutral background with 12px radius and subtle shadow.

> **Note:** Additional blueprints for onboarding, Launchpad coach, volunteer spotlight, dispute timeline, and analytics drill-downs are documented in `Screen_blueprints.md` for engineering reference.
