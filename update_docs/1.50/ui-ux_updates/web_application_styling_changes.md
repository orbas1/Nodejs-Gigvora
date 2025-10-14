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
- Header background transitions from transparent to solid after 80px scroll with drop shadow `0 8px 24px rgba(15,23,42,0.08)`.
- Mega-menu panels 960px wide with 24px padding, blurred backdrop, and subtle border.
- Active link underlines use 3px accent line with rounded caps.

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
