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
