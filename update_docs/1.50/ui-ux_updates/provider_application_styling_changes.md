# Provider Application Styling Changes — Version 1.50

## Visual Direction
- **Brand Alignment:** Shifted palette to Gigvora Indigo family with neutral charcoal backgrounds and vibrant accent pops to drive attention to actionable elements.
- **Design Tokens:** Extended design token dictionary to include semantic color aliases (`surface/raised`, `surface/subdued`, `border/critical`), elevation tiers, motion durations, and typography scales for provider-specific contexts.
- **Layout Rhythm:** Adopted 8pt spacing grid with macro layout guidelines for dashboard vs. detail views; ensures consistent breathing room while accommodating dense data tables.

## Color System
| Token | Hex | Usage | Notes |
|-------|-----|-------|-------|
| `provider.primary` | `#3730A3` | Primary CTAs, active navigation, highlight banners | Accessible at 4.7:1 contrast on white surfaces |
| `provider.secondary` | `#4C1D95` | Secondary buttons, charts, gradients | Avoid pairing with small text; use for backgrounds |
| `provider.accent` | `#F97316` | Status highlights, KPI deltas, FAB | Complementary to indigo for attention cues |
| `provider.success` | `#16A34A` | Success badges, positive alerts | Pair with `neutral.0` text |
| `provider.warning` | `#F59E0B` | Pending actions, expiring tasks | Provide icon support for color-blind accessibility |
| `provider.error` | `#EF4444` | Errors, destructive actions | Always include text labels |
| `neutral.900` | `#0F172A` | Headings, primary text | 90% opacity on light surfaces |
| `neutral.200` | `#E2E8F0` | Dividers, table borders | 1px lines with 60% opacity |

### Dark Mode Preparations
- Created tonal pairs for dark theme (e.g., `provider.primary.dark = #A5B4FC`), ensuring contrast parity.
- Documented gradient recipes for background panels in dark mode to avoid banding.

## Typography & Hierarchy
- **Heading Scale:** H1 32px/40px, H2 28px/36px, H3 24px/32px, H4 20px/28px, all using `Space Grotesk` with 500 weight.
- **Body Text:** `Inter` with sizes 16px/24px (body), 14px/20px (caption), 12px/16px (metadata). Use `font-feature-settings: "liga" 1` for improved legibility.
- **Numerical Data:** Adopted tabular figures for all metrics and financial data to align decimals.
- **Accessibility:** Minimum contrast ratios documented per text size; small text limited to non-critical metadata.

## Components Styling Updates
### Buttons
- Rounded corners reduced to 8px with consistent padding (16px horizontal, 12px vertical).
- Primary buttons use gradient overlay on hover (`linear-gradient(90deg, #4338CA 0%, #3730A3 100%)`).
- Focus state includes 2px indigo outline with 4px offset shadow for visibility.
- Loading state shows circular progress indicator with left alignment and text shift of 8px.

### Cards & Panels
- Elevation tiers defined: level 1 (shadow `0 1px 3px rgba(15,23,42,0.1)`), level 2 (shadow `0 10px 25px rgba(15,23,42,0.15)`).
- Card headers use uppercase label with letter-spacing 0.08em; footers include subtle top border using `neutral.200`.
- Data-heavy cards include background stripes for improved readability when scrolled horizontally.

### Tables
- Alternating row backgrounds using `neutral.50` and white to aid scanning.
- Sticky header styling with bottom shadow and bold label text.
- Active filters display as chips above table; applied filter tags adopt accent color with white text.
- Inline edits highlight cell with `#EEF2FF` background and 1px primary border.

### Forms & Inputs
- Input fields have 12px radius, subtle inset shadow, and placeholder text using `neutral.500`.
- Error states display red border, icon, and helper text in 14px italic.
- Multi-select chips align with new typography and spacing; selected chips display accent background and white text.
- Toggle switches use pill design with 18px knob and animated track color transitions.

### Navigation
- Left rail background `#0F172A` with 80% opacity overlay; icons white at 0.8 opacity, active states full white with accent underline.
- Hover states lighten background to `#1E293B`; tooltips use dark theme style for readability.
- Breadcrumb separators updated to chevron icons with 60% opacity.

## Charts & Data Visualisation
- Chart color palette aligned with brand (primary indigo, accent orange, secondary purple, neutral grey).
- Tooltips adopt dark background with white text, 12px radius, and drop shadow for depth.
- Added micro-legend styling with toggles to show/hide series; inactive states reduce opacity to 30%.
- Annotated thresholds use dashed lines with callout labels anchored to data points.

## Imagery & Illustration
- Updated hero and empty state illustrations to include provider personas wearing branded apparel.
- Established photo treatment guidelines: high-contrast, slight grain overlay, 4px rounded corners.
- Added library of 24 icon illustrations for compliance, finance, scheduling, messaging contexts.

## Micro-Interactions & Motion
- Drawer slide-in uses 180ms ease-out; exit 140ms ease-in.
- Button press micro-interaction includes 2px downward motion and subtle scaling (0.98).
- Table row expansion uses accordion animation with opacity fade and height transition.

## Responsiveness
- Documented breakpoints: `sm 640px`, `md 960px`, `lg 1280px`, `xl 1600px`.
- Provided layout specs for each module across breakpoints, including column count adjustments and typography scaling.
- Ensured high-density screens use vector assets and 1.5x icon scale to maintain crispness.

## Panel & Module Styling Specifications
### Purchase & Finance Experiences
- **Pricing Tiles:** Elevated gradient headers with plan badges, accent border glow, and animated savings pill that pulses subtly on hover.
- **Checkout Forms:** Stepper header uses progress dots with labelled captions; form cards adopt two-column layout on desktop, stacking on mobile while preserving visual hierarchy via numbered markers.
- **Finance Settings:** Tabs styled with segmented controls, success states highlighted with green check badge, and compliance alerts using warning banner anchored below header.
- **Invoice Ledger:** Row backgrounds alternate with soft indigo tint every third row to aid scanning; overdue invoices display red left border and bold due date.

### Project, Task, and Calendar Modules
- **Kanban Cards:** Rounded corners 12px, top badges for status, color-coded edges by project stage, and drop shadow intensifies when dragged.
- **Task Details:** Right pane features sectioned metadata panels with subtle separators, emphasis on checklist items via pill bullets and progress rings.
- **Calendar Views:** Month view uses pill events with icons denoting type (gig, interview, mentoring, volunteering); dark-on-light design ensures readability, and hover reveals quick action toolbar.
- **Budget Charts:** Combines stacked bars with gradient fills and overlay line for burn rate; threshold breaches trigger accent glow.

### Talent & Panel Dashboards
- **Roster Tables:** Avatar stack with status dot, hover reveals quick action icons; inactive members greyed with diagonal hatch overlay.
- **Mentorship Cards:** Soft gradient backgrounds with top-right goal progress donut; session cards include timeline connectors to show progress.
- **Agency & Company Summaries:** Multi-column stat blocks separated by vertical dividers and anchored call-to-action buttons using secondary color for differentiation.

### Community & Engagement Spaces
- **Networking Rooms:** Tile design with hero imagery, capacity meter as circular progress, and countdown timer in digital typeface.
- **Creation Studio Editor:** Toolbar uses floating glassmorphism panel with icons; canvas background uses subtle grid for alignment cues.
- **Volunteering Listings:** Cards with large imagery, overlay gradient to preserve text contrast, and callout badge for urgency or remote availability.
- **Messaging & Inbox:** Chat bubbles adopt slight gradient; unread states emphasised via bold text, accent dot, and subtle background highlight.

### Recruitment & Interview Interfaces
- **Job Listing Builder:** Section headers with iconography, form cards with step badges; preview mode uses device mock to validate layout.
- **Interview Room:** Dark theme with accent highlights to reduce visual fatigue, participant tiles with rounded corners, and scorecard panel using white surface for clarity.
- **Offer Summary Panels:** Use celebratory confetti animation on success, gradient button for "Generate Offer", and timeline showing approvals.

### Governance & Static Pages
- **Account Preferences:** Toggle groups arranged in cards with contrasting backgrounds; destructive options highlighted with border and icon.
- **Profile Page:** Hero uses blurred background image with overlay gradient, layered stats chips, and CTA stack for share/export actions.
- **About/Legal Pages:** Typography emphasises readability with wide margins, anchored table of contents, and sticky sidebar for quick navigation.

## Accessibility & Compliance Styling
- Focus outlines contrast ratio ≥ 3:1; consistent across keyboard and assistive technology states.
- Error messaging includes icon, text, and optional link to detailed help docs.
- High-contrast theme variant uses dark backgrounds with light text, improved for low vision.

## Asset Delivery & Implementation Notes
- Exported token JSON for Tailwind, CSS variables, and Flutter theming.
- Provided SCSS mixins for button states, gradient backgrounds, and shadow tiers.
- Included design QA checklist ensuring implementation matches spacing, color, and typography specs.

## Future Enhancements
- Prepare responsive typography clamp values for upcoming fluid type adoption.
- Explore dynamic theming for white-label providers using same base tokens with overrides.
- Prototype dark mode interactions to validate contrast and motion guidelines under inverse scheme.
