# Layout Organisation & Positioning – Phone Application v1.00

## Grid & Spacing
- Base grid: 8dp; major sections use multiples (16dp, 24dp, 32dp).
- Screen padding: 20dp horizontal on phones, 24dp on tablets; safe area respected.
- Cards maintain 16dp internal padding, 12dp spacing between meta rows, 8dp between text and chips.
- Bottom navigation height 72dp, icons centred, labels 12/16.

## Structural Patterns
- **Hero + Content:** Many screens follow hero (min height 120dp) stacked over scrollable content with `SliverAppBar`. Hero collapses to 56dp app bar when scrolled.
- **Sticky Elements:** Filter chip rows pinned at top using `SliverPersistentHeader` (height 48dp) to keep contextual filters accessible.
- **Dual Columns (Tablet):** When width ≥600dp, layout switches to 2-column content: navigation rail (72dp) + content area 560dp min width.
- **Floating Actions:** FAB anchored bottom-right with margin 20dp from edges; on tablets, transitions to extended FAB (text label). Opportunity detail uses bottom action bar anchored above safe area (16dp margin).

## Component Positioning
- **Feed Cards:** Align avatar left (48dp), text block 16dp right, metadata row bottom with icons spaced 16dp.
- **Explorer Search:** Search pill centred horizontally, vertical margin 24dp from top; voice button inside trailing edge.
- **Marketplace Analytics Pill:** Positioned top-right above list, margin 12dp from edges.
- **Launchpad Dashboard:** Progress summary card top, milestone timeline below with 24dp spacing; CTA block anchored bottom with safe area padding.
- **Profile Stats:** Three cards arranged horizontally with 12dp gap; collapses to 2+1 stacking on small devices (auto wrap).
- **Settings Sections:** Section header (title + caption) 16dp above first row; rows 56dp height with icons leading, toggles trailing.

## Responsive Considerations
- Use `LayoutBuilder` to adjust card layout (two-column grid for portfolio when width >480dp).
- Hide bottom navigation when keyboard open; reposition CTA bars to avoid overlapping input fields.
- For landscape orientation, show navigation rail and reposition hero to left column with content right.

## Alignment Rules
- Headlines align left, CTA buttons right-aligned in toolbars when width >400dp; on smaller screens, CTA stack vertically.
- Use `Spacer` to push metadata or icons to edges while maintaining consistent 16dp gap.
- All icons 24dp (except hero/illustrations). Keep consistent baseline for text by aligning using `Baseline` widget where needed.

## Spatial Token Reference
- `space.xs` = 4dp (micro spacing between icon and label), `space.sm` = 8dp, `space.md` = 16dp, `space.lg` = 24dp, `space.xl` = 32dp, `space.2xl` = 48dp.
- Vertical rhythm for forms: label 8dp above input, helper text 6dp below input, section separators 24dp.
- Navigation safe area offsets: bottom 20dp (iOS), 16dp (Android) to ensure CTA bars avoid home indicator.

## Positioning for New Surfaces
- **Support Hub:** Hero card top with 24dp margin; search field overlaps hero by -32dp using `Positioned` within `Stack`. Article grid uses `SliverGridDelegateWithFixedCrossAxisCount` with crossAxisSpacing 16dp.
- **Data Export Status:** Use `ListView.separated`, each tile 72dp height, progress bar positioned 12dp from bottom, download button trailing with 16dp margin.
- **NPS Modal:** Modal height 340dp, rating chips arranged in two rows (5 chips each) with 12dp gap. Comment field spans width minus 24dp padding and anchored above button row (buttons separated by 12dp).

## Motion Anchors & Gestures
- Transition origins align with component positions: FAB expands from bottom-right anchor, radial quick actions centre on nav icon coordinates.
- Drag handles on bottom sheets placed 12dp from top centre (width 40dp, height 4dp). Ensure sheet stops align with natural content breakpoints (e.g., 60%, 90% height).
