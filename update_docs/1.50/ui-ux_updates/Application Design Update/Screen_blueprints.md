# Screen Blueprints Catalogue – Version 1.50

Each blueprint below captures the exact layout, component IDs, positional rules, and intended interactions. Coordinates reference the 12-column grid (C1–C12) with vertical spacing measured in 8px increments (V1 = 8px, V2 = 16px, etc.). All components must align with tokens defined in `Colours.md`, `Fonts.md`, and `Organisation_and_positions.md`.

## Onboarding – Persona Selection
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ AppBar: Minimal (Back button C1, Step counter C12)                           │
├──────────────────────────────────────────────────────────────────────────────┤
│ ProgressIndicator (ID:STP-ONB-01) – spans C1-C12 at V2                       │
├──────────────────────────────────────────────────────────────────────────────┤
│ HeroIllustration (ID:IMG-ONB-01) – C2-C11, V3-V11                            │
├──────────────────────────────────────────────────────────────────────────────┤
│ CopyBlock – C2-C11                                                            │
│  • Title(TextStyle:H2, Colour:Primary900)                                     │
│  • Subtitle(TextStyle:BodyLarge, Colour:Neutral600)                           │
├──────────────────────────────────────────────────────────────────────────────┤
│ PersonaCards Grid                                                             │
│  • Card(PRS-01 Talent) – C2-C6, V13-V22                                      │
│  • Card(PRS-02 Client) – C7-C11, V13-V22                                     │
│  • Card(PRS-03 Agency) – full width at V23 with ghost border                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ PrimaryCTA Button(ID:BTN-ONB-NEXT) – anchored bottom, safe area offset 24px  │
└──────────────────────────────────────────────────────────────────────────────┘
```
- **Effects:** Persona cards elevate to +6 shadow on hover/tap and animate selection with 120ms scale-up. Illustrations fade-in from 80% opacity over 300ms on step entry.

## Launchpad Coach – Checklist Screen
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ AppBar: Title "Launchpad Coach" | Help Icon                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ ProgressMeter(ID:MTR-LP-01) – C1-C12, gradient fill                          │
├──────────────────────────────────────────────────────────────────────────────┤
│ ScoreCard(ID:SCR-LP-01) – C1-C12, V3-V8 with radial gradient background       │
├──────────────────────────────────────────────────────────────────────────────┤
│ ChecklistColumns                                                              │
│  • Column A (C1-C6): ChecklistGroup "Profile" (items CHK-001..CHK-003)        │
│  • Column B (C7-C12): ChecklistGroup "Compliance" (items CHK-004..CHK-006)   │
│  Items include checkbox, icon badge, tertiary action link.                   │
├──────────────────────────────────────────────────────────────────────────────┤
│ StickyCTA Bar (ID:BAR-LP-ACTION) – Primary: "Request Review"; Secondary: "View Tips" │
└──────────────────────────────────────────────────────────────────────────────┘
```
- **Effects:** ScoreCard pulses readiness dial when score increases. Completed checklist items animate checkmark draw (200ms stroke).

## Volunteer Spotlight – Discovery Module
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ AppBar: Title "Volunteer Hub" | Filter Button                                │
├──────────────────────────────────────────────────────────────────────────────┤
│ HeroCarousel(ID:CAR-VOL-01) – C1-C12, V2-V10                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ SpotlightCards Scroll                                                         │
│  • Card(VOL-01) – features hero image top (C1-C12, ratio 3:2), overlay gradient│
│  • Card(VOL-02) – includes ImpactBadge and ShareChip                          │
│  • Card(VOL-03) – flagged "Urgent" with red badge                             │
├──────────────────────────────────────────────────────────────────────────────┤
│ Bottom CTA Bar: "Submit Application" primary, "Share" secondary               │
└──────────────────────────────────────────────────────────────────────────────┘
```
- **Effects:** Carousel auto-advances every 6s with progress dots. Cards tilt 4° on horizontal drag to emphasise movement.

## Dispute Timeline – Escrow Resolution
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ AppBar: Breadcrumb(Project > Escrow) | CTA: "Upload Evidence"                │
├──────────────────────────────────────────────────────────────────────────────┤
│ SummaryBanner(ID:BNR-DSP-01) – C1-C12, warns with amber gradient              │
├──────────────────────────────────────────────────────────────────────────────┤
│ TimelineStack                                                                 │
│  • StageRow(DSP-01 Filed) – includes timestamp, actor avatar, status badge    │
│  • StageRow(DSP-02 Review) – expands to show checklist + attachments          │
│  • StageRow(DSP-03 Mediation) – contains CTA "Join Call"                      │
│  • StageRow(DSP-04 Resolution) – success state with confetti animation        │
├──────────────────────────────────────────────────────────────────────────────┤
│ EvidencePanel (C1-C12, V22-V30) – grid of file chips with preview option      │
├──────────────────────────────────────────────────────────────────────────────┤
│ ActionFooter: Primary "Accept Outcome" | Secondary "Escalate"                │
└──────────────────────────────────────────────────────────────────────────────┘
```
- **Effects:** Stage rows animate vertical connector growth (stroke expands from 0 to 100% in 220ms). Evidence chips open modal viewer with dimmed background.

## Analytics Drill-down – Post Performance
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ AppBar: "Post Analytics" | DateRangePicker                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│ SummaryTiles Row                                                               │
│  • Tile(ANL-01 Views)                                                          │
│  • Tile(ANL-02 Engagement)                                                     │
│  • Tile(ANL-03 Conversions)                                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│ ChartStack                                                                    │
│  • LineChart(ID:CHT-01) – spans C1-C12, V6-V16                                │
│  • BarChart(ID:CHT-02) – C1-C12, V17-V24                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ AudienceTable(ID:TBL-01) – C1-C12, sticky header                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ FAB Secondary: "Export CSV" (ID:FAB-ANL-EXP) bottom-right                     │
└──────────────────────────────────────────────────────────────────────────────┘
```
- **Effects:** Charts animate on load with 300ms ease-in-out. Table rows highlight on hover and reveal inline actions.

> For the full set of 62 screens, replicate the structure above using component IDs defined in `Screens__Update_widget_types.md`. Provide state diagrams and error variants in corresponding logic flow documents.
