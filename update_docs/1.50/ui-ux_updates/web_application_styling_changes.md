# Web Application Styling Changes — Version 1.50

## Design Objectives
- Harmonise marketing site and logged-in workspace visuals with the Gigvora v1.50 brand language.
- Deliver enterprise-grade polish through meticulous typography, responsive spacing, and motion discipline.
- Ensure accessibility compliance and scalability for future theming requirements.

## Colour System
| Token | Hex | Usage |
|-------|-----|-------|
| `web.primary` | `#312E81` | Primary CTAs, active links |
| `web.secondary` | `#4338CA` | Secondary actions, gradients |
| `web.accent` | `#F97316` | Highlights, metrics callouts |
| `web.surface` | `#FFFFFF` | Cards, modals |
| `web.surface.alt` | `#F5F7FB` | Section backgrounds |
| `web.text.primary` | `#0F172A` | Headings |
| `web.text.secondary` | `#334155` | Body copy |
| `web.border` | `#E2E8F0` | Dividers |
| `web.success` | `#16A34A` | Positive alerts |
| `web.warning` | `#F59E0B` | Warnings |
| `web.error` | `#DC2626` | Errors |

### Gradients
- CTA Gradient: `linear-gradient(90deg, #4338CA 0%, #312E81 100%)` with hover lighten effect.
- Background gradient for hero: `linear-gradient(120deg, rgba(49,46,129,0.95), rgba(30,64,175,0.85))` overlayed on imagery.
- Analytics cards use subtle radial gradient `radial-gradient(circle at top right, rgba(67,56,202,0.18), transparent 60%)`.

## Typography
- **Headlines:** `Space Grotesk` with weights 500/600, uppercase tracking for section labels.
- **Body:** `Inter` 16px/1.6 line height by default; 18px on large displays for readability.
- **Buttons & Navigation:** `Inter` 600 weight, letter spacing 0.02em.
- **Numerics:** Tabular figures in analytics sections using `font-variant-numeric: tabular-nums`.

## Layout & Spacing
- Global grid uses 12-column layout with 1200px max width on desktop; gutter 24px, margin 32px.
- Section spacing scaled to 80px top/bottom for hero, 64px for content blocks, 48px for supporting sections.
- Responsive adjustments: gutters reduce to 16px on tablet, 12px on mobile; vertical spacing clamps to maintain balance.

## Component Styling
### Navigation
- Header background transitions from transparent to solid after 80px scroll with drop shadow `0 8px 24px rgba(15,23,42,0.08)`; authenticated header emphasises the **Feed → Explore → Create → Dashboard → Profile** order with pill hover states.
- Mega-menu panels 960px wide with 24px padding, blurred backdrop, and subtle border.
- Active link underlines use 3px accent line with rounded caps; profile avatar drop-down adopts floating glassmorphism panel with segmented links for account, finance, admin, agency, company, mentorship, studio, and logout.

### Buttons
- Primary buttons: 48px height, 20px horizontal padding, 12px radius; hover lighten by 6%, focus ring 2px accent with 4px offset.
- Secondary buttons: outline style with 2px border and transparent fill; pressed state darkens border.
- Ghost buttons: transparent background, text `web.text.primary` at 80% opacity, underline on hover.

### Cards
- Corner radius 18px, drop shadow `0 24px 48px rgba(15,23,42,0.08)`, interior padding 32px.
- Card headers include icon container with gradient background and soft glow.
- Footer actions align to right with subtle top divider using `web.border` at 60% opacity.

### Tables & Data
- Header row background `#EEF2FF`; sticky with bottom border shadow.
- Row hover highlight `rgba(67,56,202,0.08)`; selected row accent border left 3px.
- Inline badges for status use pill shapes with uppercase text and high contrast.

### Forms
- Form fields 52px height, 14px radius, border `#CBD5F5`; focus state includes 2px accent outline and drop shadow.
- Helper text 14px italic, error text `web.error` with icon.
- Multi-step forms include progress indicator styled as segmented bar.

### Modals & Drawers
- Modals have 24px radius, drop shadow `0 30px 60px rgba(15,23,42,0.25)`.
- Drawer width 480px with gradient header and sticky action footer.
- Close icons increased to 24px with hit target 44px.

### Charts & Infographics
- Chart palette: Indigo, Blue, Teal, Orange, Purple with accessible contrast.
- Tooltip styling dark background `#1E293B`, white text, 12px radius; drop shadow for depth.
- Animated line charts use 400ms ease-out draw animations; area charts include gradient fill with 35% opacity.

## Module-Specific Styling
### Dashboard & Feed
- **Feed Cards:** Soft shadow, gradient header for priority items, and accent-colour badges for action types (gig, job, mentorship, networking).
- **Calendar Widget:** Uses pill events with subtle glow, interactive legend for toggling event types, and accessible colour pairings.
- **Inbox Preview:** Compact cards with avatar ring showing online status, accent border for urgent items, and hover expansion to preview message.

### Commerce & Finance
- **Purchase Page:** Plan cards employ layered backgrounds with hero illustrations, highlight best value with accent ribbon, and animate ROI calculator with incremental counters.
- **Checkout Wizard:** Step indicators show numbered circles connected by progress bar; error states shake subtly to reinforce attention.
- **Budget Dashboards:** Utilise dual-tone stacked bars, variance callouts with red/green tags, and tooltip microcharts for historical context.
- **Invoice Ledger:** Table rows adopt zebra striping with accent highlight for overdue; action buttons align right with ghost styling.

### Role-Based Panels
- **Admin Center:** Data tables use muted background with accent headers; audit log entries include icon-coded severity and monospaced timestamp.
- **Agency/Company Panels:** Multi-panel layout with gradient dividers, avatar group chips, and brand switcher styled as pill segmented control.
- **Freelancer Panel:** Pipeline cards use gradient progress bars, card corners at 16px, and status icons with drop shadow.
- **Headhunter & Mentorship Panels:** Candidate cards use avatar stacks, status chips, and timeline connectors; mentorship sessions adopt pastel backgrounds with goal progress donuts.

### Creation Studio & Launchpad
- **Editor Canvas:** Light grey background grid, floating toolbar with frosted glass effect, and selection outlines using accent glow.
- **Launchpad Checklist:** Step cards with numbered badges, progress ring for completion, and milestone banners with celebratory animation on completion.

### Networking, Volunteering & Community
- **Networking Rooms:** Neon accent border with pulsing animation, gradient countdown bar, and overlay showing host controls.
- **Speed Networking Timer:** Digital clock typography with drop shadow, progress ring wrapping avatar tiles, and gradient state transitions.
- **Volunteering Cards:** Imagery with gradient overlay, cause badge icon, and CTA button with soft shadow.
- **Messaging & Inbox:** Docked chat bubble uses circular gradient, while full inbox features tabbed filters with accent indicator.

### Recruitment & Interview Modules
- **Job Listing Manager:** Card layout with employer logos, key metrics chips, and status indicator lights; create button styled as gradient pill.
- **Interview Room:** Dark theme with accent outlines, floating participant tiles, and evaluation panel using white surface for readability.
- **Offer Panels:** Celebratory confetti animation, gradient header, and step tracker showing approval path.

### Governance & Static Pages
- **Account Preferences:** Cards with soft shadows, segmented toggles, and warning banners for risky changes.
- **Finance Settings:** Tabs use underline animation, verified items show checkmark badge, and pending verifications highlight with amber tint.
- **Legal Pages:** Typography emphasises readability, with sticky summary card, accent callouts for major updates, and breadcrumb navigation.

## Imagery & Iconography
- Photography guidelines: hero imagery featuring collaborative teams, desaturated backgrounds, overlay gradient for legibility.
- Icon set updated to 24px/32px outlines with 2px stroke; icons paired with accent backgrounds.
- Illustration style uses geometric shapes, soft shadows, and inclusive representation.

## Motion & Interactions
- Scroll-triggered fade/slide animations limited to 300ms to maintain performance.
- Hover states incorporate subtle scale (1.02) and shadow intensification.
- Mega-menu open/close uses 180ms fade with slight downward translation.

## Accessibility Enhancements
- Minimum contrast 4.5:1 across body text and 3:1 for large headings.
- Focus indicators customised with 3px outer glow to ensure visibility on dark backgrounds.
- Skip navigation link styled as visible on focus, located at top-left of viewport.
- Reduced motion preference disables decorative animations and gradient shifts.

## Implementation Notes
- Delivered CSS variable map for tokens; integrates with Tailwind config and SCSS partials.
- Provided storybook updates demonstrating new states and responsive behaviours.
- QA checklist covers typography, spacing, interactive states, and dark mode preparation.

## Future Styling Roadmap
- Develop dark mode theme leveraging existing tonal pairs.
- Create industry-specific colour accents for targeted landing pages.
- Introduce 3D hero illustration variants for upcoming campaigns.

## Maintenance Announcement Styling (10 Apr 2024)
- **Banner Placement:** Persistent top-of-shell banner sits beneath global navigation with 64px height on desktop, 56px on tablet, and 48px on mobile. When multiple announcements are active, rotate via auto-advancing carousel with 8s interval and manual previous/next controls.
- **Severity Tokens:**
  - `maintenance.info`: background `#E0E7FF`, text `#312E81`, icon `information-circle`.
  - `maintenance.maintenance`: background `#FEF3C7`, text `#92400E`, icon `wrench-screwdriver`.
  - `maintenance.incident`: background `#FEE2E2`, text `#991B1B`, icon `exclamation-triangle`.
  - `maintenance.security`: background `#FDE68A`, text `#92400E`, icon `shield-exclamation` with animated pulse.
- **Typography:** Title uses `Space Grotesk` 18px/24px bold; body text `Inter` 15px/22px. Links styled as underline accent with focus outline.
- **Interactions:**
  - Dismiss button uses tertiary ghost treatment with `aria-controls` linking to collapse region; persists in local storage per slug for 24h unless status transitions to `active`.
  - Keyboard shortcuts: `Alt+Shift+M` toggles focus to banner, `Esc` dismisses when allowed.
  - Screen-reader announcements triggered via `aria-live="assertive"` on high severity (incident/security) and `polite` on info/maintenance.
- **Responsive Behaviour:** Mobile view swaps to stacked layout: title and message on first line, CTA/dismiss aligned bottom-right. Banner collapses into pill when resolved, exposing "View history" link to admin runtime panel.
- **Analytics Hooks:** Track impressions (`maintenance_banner_impression`), dismiss events (`maintenance_banner_dismiss`), CTA clicks (`maintenance_banner_cta_click`), and manual refresh (`maintenance_banner_refresh`). Attributes include `slug`, `severity`, `status`, and `audience`.
