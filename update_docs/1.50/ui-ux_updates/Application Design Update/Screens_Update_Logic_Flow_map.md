# Screens Logic Flow Map

```
[Onboarding]
  Welcome
    → Persona Selection (Talent | Client | Agency | Hybrid)
        • Blueprint: `Screen_blueprints.md` – Onboarding Persona Selection (component IDs `STP-ONB-01`, `PRS-01..03`, `BTN-ONB-NEXT`)
      → (Talent) Identity Verification → Skills Capture → Launchpad Coach Intro
      → (Client) Company Setup → Payment Method → Project Templates Intro
      → (Agency) Workspace Setup → Team Invitations → Compliance Checklist
    → MFA Setup → Tutorial Carousel → Home Dashboard (persona variant)

[Home Dashboard]
  → Quick Actions (Create Project | Post Update | Post Job | View Launchpad)
      • Anchored to `FAB-CORE` with action list defined in widget catalogue.
  → Notification Centre → (Milestone Alert → Project Workspace) | (Auto-Assign → Application Modal)
  → Feed → Post Detail → Comment / Share / Save

[Work Tab]
  Project List → Project Detail Tabs (Overview ↔ Tasks ↔ Files ↔ Chat ↔ Escrow)
    • Blueprint: Project Detail – Tasks (IDs `ESC-002`, `PRG-001`, `BTN-LOG-TIME`, `BTN-SUBMIT-DELIVERABLE`).
    → Escrow Timeline → Release Funds | Open Dispute → Dispute Flow (Mediation → Investigation → Arbitration)
      • Blueprint: Dispute Timeline (IDs `BNR-DSP-01`, `DSP-01..04`, `BTN-ACCEPT`, `BTN-ESCALATE`).
    → Tasks → Task Detail → Approve / Request Changes
  Contest List → Contest Detail → Submission Upload → Scoreboard

[Discover Tab]
  Global Search ↔ Filter Drawer → Result Detail (Gig | Job | Volunteer | Talent | Agency)
  Launchpad Hub → Readiness Checklist → Recommended Gigs
    • Blueprint: Launchpad Coach (IDs `MTR-LP-01`, `SCR-LP-01`, `BAR-LP-ACTION`).
  Volunteer Hub → Opportunity Detail → Apply → Follow-up Chat
    • Blueprint: Volunteer Spotlight (IDs `CAR-VOL-01`, `VOL-01..03`, CTA bar mapping in `Screen_buttons.md`).
  Ads Marketplace → Campaign Detail → Sponsor CTA

[Profile Tab]
  Profile Overview → Edit Section (About | Experience | Portfolio | Trust)
  Analytics Snapshot → View Metrics Detail → Export
    • Blueprint: Analytics Drill-down (IDs `ANL-01..03`, `CHT-01`, `CHT-02`, `FAB-ANL-EXP`).
  Settings Shortcut → Settings Home

[Settings]
  Settings Home → Notifications | Privacy | Payments | Legal & Compliance | Device Preferences
  Notifications → Channel Preferences → Quiet Hours
  Payments → Add Method → Verification

[Support]
  Floating Chat Bubble → Drawer (Projects | Support | Community)
    → Support Ticket → Categorise Issue → Knowledge Suggestions → Connect to Agent → Transcript in Inbox
```
