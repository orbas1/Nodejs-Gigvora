# Screen Colour Specifications

## Core Palette
- **Primary 500 (Sapphire #1E4ED8):** Navigation bars, primary buttons, key highlights.
- **Primary 600 (Indigo #1A3FA4):** Hover/pressed states, provider financial callouts.
- **Secondary 500 (Sky #38BDF8):** Accent backgrounds for callouts, Launchpad surfaces.
- **Neutral 50/100/200/700:** Backgrounds, cards, border strokes, typography.
- **Success (Emerald #10B981), Warning (Amber #F59E0B), Danger (Rose #F43F5E):** Semantic states across banners, buttons, and icons.

## Module-Specific Overrides
- **Live Feed:** Alternating background stripes (#F8FAFC) for readability; polls use Secondary 500 gradient fill.
- **Launchpad:** Purple accent (#7C3AED) for progress meter and readiness badge.
- **Volunteer Hub:** Teal accent (#0EA5E9) to differentiate from gigs/jobs.
- **Escrow & Finance:** Dark indigo backgrounds (#111827) with white text for modal headers to reinforce seriousness.

## Gradients & Elevation
- **Primary Gradient:** Linear 135° Sapphire → Sky applied to FAB, hero cards, and key CTAs.
- **Secondary Gradient:** Violet → Purple for Launchpad completions.
- Cards use soft shadows (0 8px 24px rgba(15, 23, 42, 0.08)) with optional border (#E2E8F0).

## Accessibility Notes
- All text on Primary gradient meets contrast by using pure white (#FFFFFF) or off-white (#F8FAFC).
- Banners and alerts have dedicated text colours to maintain legibility: success text (#064E3B), warning (#92400E), danger (#7F1D1D).
- High-contrast mode swaps gradients for solid colours (Primary 700, Secondary 700) and increases border thickness to 2px.
